import type { IntentExample } from './intent.types';

/** 30 Canonical Few-Shot Intent Examples covering all 5 intent categories */
export const INTENT_EXAMPLES: IntentExample[] = [
  // --- 1. Analytics (6 examples) ---
  { query: 'Show monthly revenue for 2025', intent: 'analytics' },
  { query: 'What is the highest selling category this quarter?', intent: 'analytics' },
  { query: 'Display sales trend over the last 6 months', intent: 'analytics' },
  { query: 'Who are our top 10 customers by purchase volume?', intent: 'analytics' },
  { query: 'Compare Q1 vs Q2 revenue by region', intent: 'analytics' },
  { query: 'Show average order value grouped by device type', intent: 'analytics' },

  // --- 2. Backtesting (6 examples) ---
  { query: 'Compare SMA Crossover vs RSI strategy performance', intent: 'analytics' }, // Note: comparison of strategies
  { query: 'Compare SMA Crossover vs RSI Strategy', intent: 'backtesting' },
  { query: 'What is the Sharpe Ratio of my backtest run?', intent: 'backtesting' },
  { query: 'Run a backtest on AAPL using Bollinger Bands', intent: 'backtesting' },
  { query: 'Show historical strategy performance for 2024', intent: 'backtesting' },
  { query: 'What was the Max Drawdown during the backtest period?', intent: 'backtesting' },

  // --- 3. Retail (6 examples) ---
  { query: 'Recommend a high performance gaming laptop', intent: 'retail' },
  { query: 'Show me smartphones available under 30000', intent: 'retail' },
  { query: 'Compare iPhone 15 Pro vs Samsung S24 Ultra', intent: 'retail' },
  { query: 'Find products similar to wireless mechanical keyboard', intent: 'retail' },
  { query: 'What accessories are compatible with MacBook Air?', intent: 'retail' },
  { query: 'List noise-canceling headphones in stock', intent: 'retail' },

  // --- 4. Knowledge (6 examples) ---
  { query: 'What is CAGR and how is it calculated?', intent: 'knowledge' },
  { query: 'Explain inventory turnover ratio in simple terms', intent: 'knowledge' },
  { query: 'How does RSI technical indicator work?', intent: 'knowledge' },
  { query: 'What is a Bollinger Band in trading?', intent: 'knowledge' },
  { query: 'Explain the difference between gross margin and net margin', intent: 'knowledge' },
  { query: 'What does Sortino Ratio measure?', intent: 'knowledge' },

  // --- 5. General (6 examples) ---
  { query: 'Hello', intent: 'general' },
  { query: 'Hi there, good morning', intent: 'general' },
  { query: 'Thank you for your help', intent: 'general' },
  { query: 'Who are you and what can you do?', intent: 'general' },
  { query: 'What features does this platform support?', intent: 'general' },
  { query: 'Okay thanks bye', intent: 'general' },
];
