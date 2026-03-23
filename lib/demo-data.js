// Realistic demo data shown when Vercel KV is not yet connected
const now = Date.now()
const h = (n) => now - n * 3600000

export const DEMO_RUNS = [
  {
    id: 'demo-1', timestamp: new Date(h(2)).toISOString(),
    articles_scanned: 30, pr_count: 2, total_cost: 215000, email_sent: true,
    email_sent_to: ['audit@leadership.ng', 'account@leadership.ng', 'digital@leadership.ng'],
    pr_articles: [
      { id: 564107, title: 'Real Estate: Academy To Train Aspiring Professionals',
        url: 'https://leadership.ng/real-estate-academy-to-train-aspiring-professionals/',
        author: 'Emeka Okafor', date: new Date(h(2.5)).toISOString(),
        score: 3, signals: ['+2 PR opening phrase ("In a bold move")', '+1 PR goal language'], cost: 107500 },
      { id: 564089, title: 'BankCorp Unveils New Digital Banking Solution For SMEs',
        url: 'https://leadership.ng/bankcorp-unveils-digital-banking-smes/',
        author: 'Chidinma Adeyemi', date: new Date(h(3)).toISOString(),
        score: 5, signals: ['+2 Product/service launch', '+2 CEO-centric quote', '+1 Buzzword: seamless'], cost: 107500 },
    ],
  },
  {
    id: 'demo-2', timestamp: new Date(h(8)).toISOString(),
    articles_scanned: 30, pr_count: 0, total_cost: 0, email_sent: false,
    email_sent_to: ['audit@leadership.ng', 'account@leadership.ng', 'digital@leadership.ng'],
    pr_articles: [],
  },
  {
    id: 'demo-3', timestamp: new Date(h(14)).toISOString(),
    articles_scanned: 30, pr_count: 1, total_cost: 107500, email_sent: true,
    email_sent_to: ['audit@leadership.ng', 'account@leadership.ng', 'digital@leadership.ng'],
    pr_articles: [
      { id: 563944, title: 'TechVentures Announces Strategic Partnership With Global Investors',
        url: 'https://leadership.ng/techventures-strategic-partnership/',
        author: 'Oluwaseun Bello', date: new Date(h(14.5)).toISOString(),
        score: 4, signals: ['+2 Strategic partnership', '+1 Commitment language', '+1 PR buzzword'], cost: 107500 },
    ],
  },
  {
    id: 'demo-4', timestamp: new Date(h(20)).toISOString(),
    articles_scanned: 30, pr_count: 3, total_cost: 322500, email_sent: true,
    email_sent_to: ['audit@leadership.ng', 'account@leadership.ng', 'digital@leadership.ng'],
    pr_articles: [
      { id: 563820, title: 'Healthwise Foundation Launches Community Wellness Programme',
        url: 'https://leadership.ng/healthwise-foundation-launches-wellness/',
        author: 'Ngozi Nwosu', date: new Date(h(20.5)).toISOString(),
        score: 3, signals: ['+2 Product/service launch', '+1 PR goal language'], cost: 107500 },
      { id: 563815, title: 'FintechNG Appoints New Chief Executive Officer',
        url: 'https://leadership.ng/fintechng-appoints-new-ceo/',
        author: 'Yemi Adeyinka', date: new Date(h(21)).toISOString(),
        score: 4, signals: ['+2 Executive appointment', '+2 CEO-centric quote'], cost: 107500 },
      { id: 563790, title: 'SolarPower Nigeria Unveils State-of-the-Art Clean Energy Solution',
        url: 'https://leadership.ng/solarpower-unveils-clean-energy-solution/',
        author: 'Fatima Mahmoud', date: new Date(h(22)).toISOString(),
        score: 5, signals: ['+2 Product/service launch', '+1 Buzzword: state-of-the-art', '+2 CEO-centric quote'], cost: 107500 },
    ],
  },
  // Archive-only entries (>48h ago)
  {
    id: 'demo-5', timestamp: new Date(h(50)).toISOString(),
    articles_scanned: 30, pr_count: 1, total_cost: 107500, email_sent: true,
    email_sent_to: ['audit@leadership.ng', 'account@leadership.ng', 'digital@leadership.ng'],
    pr_articles: [
      { id: 563600, title: 'Insurance Giant Commits To Expanding Coverage Nationwide',
        url: 'https://leadership.ng/insurance-giant-expanding-coverage/',
        author: 'Amara Obi', date: new Date(h(51)).toISOString(),
        score: 3, signals: ['+1 Commitment language', '+2 CEO-centric quote'], cost: 107500 },
    ],
  },
  {
    id: 'demo-6', timestamp: new Date(h(74)).toISOString(),
    articles_scanned: 30, pr_count: 2, total_cost: 215000, email_sent: true,
    email_sent_to: ['audit@leadership.ng', 'account@leadership.ng', 'digital@leadership.ng'],
    pr_articles: [
      { id: 563400, title: 'EduTech Startup Proud To Announce Nationwide Expansion',
        url: 'https://leadership.ng/edutech-startup-nationwide-expansion/',
        author: 'Blessing Eze', date: new Date(h(75)).toISOString(),
        score: 5, signals: ['+3 PR announcement phrase', '+2 Product/service launch'], cost: 107500 },
      { id: 563380, title: 'Leading Logistics Company Unveils World-Class Fleet',
        url: 'https://leadership.ng/logistics-company-unveils-fleet/',
        author: 'Tunde Fashola', date: new Date(h(76)).toISOString(),
        score: 4, signals: ['+2 Product/service launch', '+1 Buzzword: world-class', '+1 Commitment language'], cost: 107500 },
    ],
  },
]

export function getDemoData(hoursBack = 48) {
  const cutoff = Date.now() - hoursBack * 3600000
  return DEMO_RUNS
    .filter(r => new Date(r.timestamp).getTime() > cutoff)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}
