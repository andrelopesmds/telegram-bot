import { formatPrice, formatPercentage } from '../helper'
import { TickerType, Ticker } from '../ticker.interface';
import { getTickers } from '../dynamodb';
import { getStockPrice, getCryptoPrice, sendMessage } from '../api'
import { logger, getErrorDetails, sanitizeError } from '../logger'

interface TickerPrice {
  ticker: Ticker
  price: number | undefined
}

export const handler = async (_event: unknown): Promise<void> => {
  const startedAt = Date.now()
  let stage = 'load_tickers'

  try {
    const tickers = await getTickers()

    const stockTickers = tickers.filter(ticker => ticker.type === TickerType.Stocks)
    const cryptoTickers = tickers.filter(ticker => ticker.type === TickerType.Crypto)
    logger.info('tickers_loaded', {
      totalCount: tickers.length,
      stockCount: stockTickers.length,
      cryptoCount: cryptoTickers.length,
      unsupportedCount: tickers.length - stockTickers.length - cryptoTickers.length,
      durationMs: Date.now() - startedAt
    })

    stage = 'fetch_prices'
    const [stockPrices, cryptoPrices] = await Promise.all([
      fetchPrices(stockTickers, getStockPrice),
      fetchPrices(cryptoTickers, getCryptoPrice)
    ])

    stage = 'build_message'
    const stocksSection = buildSection('Stocks', stockPrices)
    const cryptosSection = buildSection('Cryptos', cryptoPrices)
    const message = [stocksSection, cryptosSection]
      .filter(section => section.length > 0)
      .join('\n')

    if (!message) {
      logger.info('report_skipped', {
        reason: tickers.length === 0 ? 'no_tickers' : 'no_valid_prices',
        durationMs: Date.now() - startedAt
      })
      return
    }

    stage = 'send_message'
    const sendStartedAt = Date.now()
    logger.info('telegram_send_started', { messageLength: message.length })
    await sendMessage(message)
    logger.info('report_sent', {
      messageLength: message.length,
      sendDurationMs: Date.now() - sendStartedAt,
      durationMs: Date.now() - startedAt
    })
  } catch (error) {
    logger.error('tracker_failed', {
      stage,
      durationMs: Date.now() - startedAt,
      ...getErrorDetails(error)
    })
    throw sanitizeError(error)
  }
};

const fetchPrices = async (
  tickers: Ticker[],
  getPrice: (key: string) => Promise<number | undefined>
): Promise<TickerPrice[]> => {
  if (tickers.length === 0) return []

  const startedAt = Date.now()
  const prices: TickerPrice[] = []

  for (const ticker of tickers) {
    const price = await getPrice(ticker.key)
    prices.push({ ticker, price })
  }

  const availableCount = prices.filter(({ price }) =>
    typeof price === 'number' && Number.isFinite(price)
  ).length
  logger.info('price_group_completed', {
    group: tickers[0].type,
    requestedCount: tickers.length,
    availableCount,
    failedCount: tickers.length - availableCount,
    durationMs: Date.now() - startedAt
  })

  return prices
}

const buildSection = (heading: string, prices: TickerPrice[]): string => {
  let lines = ''

  for (const { ticker, price } of prices) {
    if (typeof price === 'number' && Number.isFinite(price)) {
      lines += buildMessageLine(ticker, price)
    }
  }

  return lines ? `${heading}:\n${lines}` : ''
}

const buildMessageLine = (ticker: Ticker, price: number): string => {
  let line = `${ticker.name}: ${formatPrice(price)}`

  const { target } = ticker
  if (target) {
    const percentage = formatPercentage(price / target * 100)
    line += ` (${percentage}% of target)`
  }

  return `${line}\n`
}
