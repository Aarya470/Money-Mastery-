// The six areas DECA's Financial Literacy Project names:
// spending and saving, credit and debt, employment and income, investing,
// risk and insurance, financial decision making.

export const LESSONS = [
  {
    id: 'income',
    title: 'Employment and income',
    summary: 'Your salary is not what lands in your account.',
    points: [
      'Gross pay is what you earn; net (take-home) pay is what is left after taxes and deductions.',
      'Every paycheck has FICA taken out: 6.2% for Social Security and 1.45% for Medicare.',
      'A W-4 tells your employer how much federal tax to hold back. Too much means a refund later; too little means a bill.',
      'If you earn under the standard deduction ($16,100 single for 2026), you often owe no federal income tax and can file to get withholding back.',
    ],
    tool: 'paycheck',
  },
  {
    id: 'spending',
    title: 'Spending and saving',
    summary: 'Give every dollar a job before the month starts.',
    points: [
      'The 50/30/20 rule is a starting point: 50% needs, 30% wants, 20% savings.',
      'Pay yourself first: move savings out on payday, not with what is left at the end of the month.',
      'Build an emergency fund of 3 to 6 months of needs before taking big risks.',
      'Small daily habits add up: $6 a day is about $180 a month and $2,190 a year.',
    ],
    tool: 'budget',
  },
  {
    id: 'credit',
    title: 'Credit and debt',
    summary: 'Credit is a tool; interest is the price.',
    points: [
      'Your credit score is mostly payment history and how much of your limit you use.',
      'Keep card balances under about 30% of the limit, and pay the full statement balance to pay no interest.',
      'Minimum payments stretch a balance for years and can cost more in interest than the original purchase.',
      'Student loans, car loans and cards all compound; compare the APR, not only the monthly payment.',
    ],
    tool: 'debt',
  },
  {
    id: 'investing',
    title: 'Investing',
    summary: 'Time in the market does the heavy lifting.',
    points: [
      'Compound growth means you earn returns on your past returns.',
      'Starting ten years earlier can matter more than contributing twice as much later.',
      'Index funds spread money across many companies for low fees.',
      'A Roth IRA lets earned income grow tax-free for retirement; teens with a job can open a custodial one.',
    ],
    tool: 'goals',
  },
  {
    id: 'risk',
    title: 'Risk and insurance',
    summary: 'Insurance trades a small known cost for protection from a large unknown one.',
    points: [
      'A premium is what you pay for coverage; a deductible is what you pay before insurance starts paying.',
      'A higher deductible usually means a lower premium, so keep enough savings to cover it.',
      'Car insurance is required in nearly every state; renters insurance is cheap and covers your belongings.',
      'You can usually stay on a parent’s health plan until age 26.',
    ],
    tool: null,
  },
  {
    id: 'decisions',
    title: 'Financial decision making',
    summary: 'Every choice has an opportunity cost.',
    points: [
      'Opportunity cost is what you give up by choosing one option over another.',
      'Compare the total cost of a purchase, including interest, fees and upkeep.',
      'Wait 24 hours before a large purchase you did not plan for.',
      'Scams pressure you to act fast or pay with gift cards or crypto; real organizations do not.',
    ],
    tool: 'coach',
  },
];

export const QUIZ = [
  {
    q: 'You earn $1,000 gross in a paycheck. What is true about your take-home pay?',
    options: ['It is exactly $1,000', 'It is less, after taxes and deductions', 'It is more, because of the standard deduction', 'It depends only on your state'],
    a: 1,
    why: 'Federal income tax, Social Security, Medicare and often state tax come out first. Take-home (net) pay is always less than gross.',
  },
  {
    q: 'What percent of each paycheck goes to Social Security for most workers?',
    options: ['1.45%', '6.2%', '10%', '15%'],
    a: 1,
    why: 'Employees pay 6.2% for Social Security (up to the yearly wage base) and 1.45% for Medicare. Employers match both.',
  },
  {
    q: 'Under the 50/30/20 rule, the 20% is for:',
    options: ['Rent', 'Entertainment', 'Savings and paying down debt', 'Taxes'],
    a: 2,
    why: '50% needs, 30% wants, 20% savings and extra debt payments, all out of take-home pay.',
  },
  {
    q: 'An emergency fund should usually cover:',
    options: ['One week of spending', '3 to 6 months of needs', 'A new phone', 'Next year’s vacation'],
    a: 1,
    why: 'Three to six months of essential expenses protects you from a lost job, a car repair or a medical bill.',
  },
  {
    q: 'You owe $2,000 on a card at 24% APR. Paying only the minimum will most likely:',
    options: ['Pay it off in a year', 'Cost no interest', 'Take years and cost hundreds or thousands in interest', 'Raise your credit limit'],
    a: 2,
    why: 'With a typical minimum payment, $2,000 at 24% takes over a decade to clear and costs more in interest than the original balance.',
  },
  {
    q: 'Which matters most for your credit score?',
    options: ['Your income', 'Paying bills on time', 'How many cards you own', 'Your bank'],
    a: 1,
    why: 'Payment history is the biggest single factor, followed by how much of your available credit you use.',
  },
  {
    q: 'Ana invests $100 a month from age 16 to 26 and then stops. Ben invests $100 a month from 26 to 36. At 7% a year, who has more at 60?',
    options: ['Ben, because he invests later', 'They have the same', 'Ana, because her money compounds longer', 'Neither earns anything'],
    a: 2,
    why: 'Both put in $12,000, but Ana’s money has ten extra years to compound. Time does the heavy lifting.',
  },
  {
    q: 'A deductible is:',
    options: ['The monthly cost of insurance', 'What you pay before insurance pays', 'A tax refund', 'An interest rate'],
    a: 1,
    why: 'The premium is the regular cost; the deductible is what you pay out of pocket before coverage starts.',
  },
  {
    q: 'Choosing a $60 concert ticket instead of saving that $60 is an example of:',
    options: ['Compound interest', 'Opportunity cost', 'Inflation', 'A deductible'],
    a: 1,
    why: 'Opportunity cost is what you give up: here, the $60 (and what it could have grown to) you did not save.',
  },
  {
    q: 'Someone texts that you won a prize but must pay a fee with gift cards today. You should:',
    options: ['Pay quickly before it expires', 'Ask a friend to pay', 'Ignore it: it is a scam', 'Send your bank login instead'],
    a: 2,
    why: 'Pressure to act fast and payment by gift card are classic scam signs. Real prizes never ask for that.',
  },
];
