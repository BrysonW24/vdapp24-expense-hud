import type { Category, UserSettings } from '@/types'

export const defaultCategories: Omit<Category, 'id'>[] = [
  // Expenses
  { name: 'Groceries', icon: 'shopping-cart', color: '#22c55e', type: 'expense', keywords: ['woolworths', 'coles', 'aldi', 'iga', 'costco', 'harris farm', 'fruit', 'grocer'], budget: undefined, isDefault: true, sortOrder: 1 },
  { name: 'Dining & Takeaway', icon: 'utensils', color: '#f97316', type: 'expense', keywords: ['uber eats', 'doordash', 'menulog', 'mcdonald', 'kfc', 'subway', 'cafe', 'coffee', 'restaurant', 'pizza', 'sushi', 'nando', 'guzman', 'zambrero', 'grill'], budget: undefined, isDefault: true, sortOrder: 2 },
  { name: 'Transport', icon: 'car', color: '#3b82f6', type: 'expense', keywords: ['uber', 'didi', 'ola', 'opal', 'petrol', 'ampol', 'bp ', 'caltex', '7-eleven fuel', 'shell', 'metro', 'parking', 'toll', 'linkt'], budget: undefined, isDefault: true, sortOrder: 3 },
  { name: 'Rent / Mortgage', icon: 'home', color: '#8b5cf6', type: 'expense', keywords: ['rent', 'mortgage', 'realestate', 'ray white', 'harcourts', 'domain', 'loan repay'], budget: undefined, isDefault: true, sortOrder: 4 },
  { name: 'Utilities', icon: 'zap', color: '#eab308', type: 'expense', keywords: ['agl', 'origin', 'energy australia', 'sydney water', 'telstra', 'optus', 'vodafone', 'nbn', 'electricity', 'gas bill', 'water bill'], budget: undefined, isDefault: true, sortOrder: 5 },
  { name: 'Subscriptions', icon: 'repeat', color: '#06b6d4', type: 'expense', keywords: ['netflix', 'spotify', 'apple.com', 'google storage', 'amazon prime', 'disney', 'youtube', 'stan', 'binge', 'kayo', 'chatgpt', 'openai', 'icloud', 'adobe'], budget: undefined, isDefault: true, sortOrder: 6 },
  { name: 'Health & Fitness', icon: 'heart-pulse', color: '#ef4444', type: 'expense', keywords: ['pharmacy', 'chemist', 'priceline', 'anytime fitness', 'gym', 'f45', 'doctor', 'medical', 'dental', 'physio', 'medicare'], budget: undefined, isDefault: true, sortOrder: 7 },
  { name: 'Shopping', icon: 'shopping-bag', color: '#ec4899', type: 'expense', keywords: ['kmart', 'target', 'big w', 'bunnings', 'ikea', 'amazon', 'ebay', 'jb hi', 'officeworks', 'harvey norman', 'the iconic', 'asos'], budget: undefined, isDefault: true, sortOrder: 8 },
  { name: 'Entertainment', icon: 'gamepad-2', color: '#a855f7', type: 'expense', keywords: ['event cinema', 'hoyts', 'ticketek', 'steam', 'playstation', 'xbox', 'nintendo', 'village', 'bowling', 'laser'], budget: undefined, isDefault: true, sortOrder: 9 },
  { name: 'Insurance', icon: 'shield', color: '#64748b', type: 'expense', keywords: ['nrma', 'allianz', 'medibank', 'bupa', 'hcf', 'ahi', 'insurance', 'youi', 'budget direct', 'suncorp'], budget: undefined, isDefault: true, sortOrder: 10 },
  { name: 'Education', icon: 'graduation-cap', color: '#0ea5e9', type: 'expense', keywords: ['university', 'tafe', 'udemy', 'coursera', 'skillshare', 'school', 'hecs', 'student'], budget: undefined, isDefault: true, sortOrder: 11 },
  { name: 'Personal Care', icon: 'scissors', color: '#f472b6', type: 'expense', keywords: ['barber', 'hairdresser', 'beauty', 'salon', 'spa', 'nail'], budget: undefined, isDefault: true, sortOrder: 12 },
  { name: 'Fees & Charges', icon: 'landmark', color: '#94a3b8', type: 'expense', keywords: ['bank fee', 'atm fee', 'account fee', 'international fee', 'overdraft', 'late fee', 'annual fee'], budget: undefined, isDefault: true, sortOrder: 13 },
  { name: 'Travel', icon: 'plane', color: '#14b8a6', type: 'expense', keywords: ['booking.com', 'airbnb', 'qantas', 'jetstar', 'virgin australia', 'hotels', 'expedia', 'webjet', 'flight'], budget: undefined, isDefault: true, sortOrder: 14 },
  { name: 'Gifts & Donations', icon: 'gift', color: '#f43f5e', type: 'expense', keywords: ['gift', 'donation', 'charity', 'gofundme', 'present'], budget: undefined, isDefault: true, sortOrder: 15 },
  { name: 'Alcohol & Bars', icon: 'wine', color: '#b45309', type: 'expense', keywords: ['liquorland', 'dan murphy', 'bws', 'bar', 'pub', 'brewery', 'wine', 'bottle shop'], budget: undefined, isDefault: true, sortOrder: 16 },
  { name: 'Uncategorised', icon: 'help-circle', color: '#6b7280', type: 'expense', keywords: [], budget: undefined, isDefault: true, sortOrder: 99 },

  // Income
  { name: 'Salary', icon: 'banknote', color: '#22c55e', type: 'income', keywords: ['salary', 'wages', 'pay', 'payroll'], budget: undefined, isDefault: true, sortOrder: 1 },
  { name: 'Freelance', icon: 'laptop', color: '#3b82f6', type: 'income', keywords: ['invoice', 'consulting', 'freelance', 'contract'], budget: undefined, isDefault: true, sortOrder: 2 },
  { name: 'Interest', icon: 'trending-up', color: '#14b8a6', type: 'income', keywords: ['interest earned', 'interest credit', 'bonus interest'], budget: undefined, isDefault: true, sortOrder: 3 },
  { name: 'Refund', icon: 'rotate-ccw', color: '#f97316', type: 'income', keywords: ['refund', 'reversal', 'cashback', 'rebate'], budget: undefined, isDefault: true, sortOrder: 4 },
  { name: 'Transfer In', icon: 'arrow-down-left', color: '#8b5cf6', type: 'income', keywords: ['transfer from', 'bpay credit', 'direct credit'], budget: undefined, isDefault: true, sortOrder: 5 },
  { name: 'Other Income', icon: 'plus-circle', color: '#06b6d4', type: 'income', keywords: ['dividend', 'rental income', 'centrelink', 'government'], budget: undefined, isDefault: true, sortOrder: 6 },

  // Transfers
  { name: 'Transfer', icon: 'arrow-right-left', color: '#6b7280', type: 'transfer', keywords: ['transfer to', 'transfer between', 'internal transfer'], budget: undefined, isDefault: true, sortOrder: 1 },
]

export const defaultSettings: Omit<UserSettings, 'id'> = {
  currency: 'AUD',
  dateFormat: 'DD/MM/YYYY',
  defaultBankFormat: 'commbank',
  theme: 'system',
}
