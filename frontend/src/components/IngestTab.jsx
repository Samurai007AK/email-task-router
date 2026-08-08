import React, { useState } from 'react'
import ShimmerButton from './ui/ShimmerButton'
import SpotlightCard from './ui/SpotlightCard'
import MagicCard from './ui/MagicCard'
import NumberTicker from './ui/NumberTicker'
import Marquee from './ui/Marquee'
import GradientText from './ui/GradientText'
import {
  IconInbox,
  IconZap,
  IconCheck,
  IconRefresh,
  IconClock,
  IconAlert,
  IconFile,
  IconSparkles,
} from './ui/Icons'

function generateSampleEmails() {
  const companies = [
    { name: 'Meridian Steel', domain: 'meridiansteel.co.in', type: 'enterprise' },
    { name: 'Railyard Logistics', domain: 'railyardlogistics.in', type: 'smb' },
    { name: 'BHEL', domain: 'bhel.co.in', type: 'psu' },
    { name: 'India SaaS Summit', domain: 'saassummit.in', type: 'event' },
    { name: 'Vantage Cloud Services', domain: 'vantagecloud.in', type: 'vendor' },
    { name: 'Zenith Cloud Partners', domain: 'zenithcloud.com', type: 'partner' },
    { name: 'Halcyon Retail', domain: 'halcyonretail.com', type: 'enterprise' },
    { name: 'TechCorp India', domain: 'techcorp.in', type: 'enterprise' },
    { name: 'Mahindra Dealers', domain: 'mahindra.in', type: 'enterprise' },
    { name: 'Infosys BPO', domain: 'infosys.com', type: 'enterprise' },
    { name: 'Tata Consulting', domain: 'tcs.com', type: 'enterprise' },
    { name: 'Wipro Technologies', domain: 'wipro.com', type: 'enterprise' },
    { name: 'HCL Technologies', domain: 'hcltech.com', type: 'enterprise' },
    { name: 'TechCrunch India', domain: 'techcrunch.com', type: 'media' },
    { name: 'WebGrowth.IO', domain: 'webgrowth.io', type: 'vendor' },
    { name: 'GrowthHackers', domain: 'growthhackers.com', type: 'vendor' },
    { name: 'StartupIndia Hub', domain: 'startupindia.gov.in', type: 'govt' },
    { name: 'NASSCOM', domain: 'nasscom.in', type: 'industry' },
    { name: 'CII South', domain: 'cii.in', type: 'industry' },
    { name: 'FICCI', domain: 'ficci.in', type: 'industry' },
  ]

  const firstNames = ['Amit', 'Priya', 'Rahul', 'Sneha', 'Vikram', 'Meera', 'Arjun', 'Neha', 'Karan', 'Pooja', 'Rajesh', 'Anita', 'Suresh', 'Deepa', 'Manoj', 'Kavita', 'Sanjay', 'Rekha', 'Ashok', 'Geeta']
  const lastNames = ['Sharma', 'Patel', 'Kumar', 'Singh', 'Reddy', 'Iyer', 'Gupta', 'Nair', 'Verma', 'Joshi', 'Menon', 'Rao', 'Desai', 'Mishra', 'Kulkarni', 'Tiwari', 'Bose', 'Chatterjee', 'Mukherjee', 'Banerjee']

  const rfpSubjects = [
    'RFP - Enterprise Document Management System',
    'Request for Proposal - Cloud Migration Services',
    'Tender Notice - IT Infrastructure Upgrade',
    'RFP for Analytics Platform Implementation',
    'Invitation to Bid - Cybersecurity Solutions',
    'RFP - ERP System Modernization',
    'Tender for Data Center Migration',
    'Request for Proposal - AI/ML Platform',
    'RFP - Customer Relationship Management',
    'Tender Notice - Network Infrastructure',
  ]

  const smbSubjects = [
    'Quick demo request',
    'Product enquiry for our team',
    'Interested in your platform',
    'Demo request - small team',
    'Can we schedule a call?',
    'Product pricing inquiry',
    'Looking for a solution for 50 users',
    'Demo for our startup',
    'Quick question about your product',
    'Trial request for evaluation',
  ]

  const marketingSubjects = [
    'Sponsorship confirmation needed',
    'Webinar partnership opportunity',
    'Conference sponsorship - Gold tier',
    'Content collaboration proposal',
    'PR opportunity for your brand',
    'Event sponsorship - India Tech Summit',
    'Webinar co-hosting proposal',
    'Marketing partnership discussion',
    'Sponsorship for Annual Tech Conference',
    'Content marketing collaboration',
  ]

  const allianceSubjects = [
    'Partnership opportunity - Reseller',
    'Technology integration proposal',
    'Channel partner inquiry',
    'Reseller agreement discussion',
    'Strategic alliance proposal',
    'Integration partnership',
    'Channel partner program',
    'Technology partnership inquiry',
    'Reseller opportunity in MEA region',
    'Partnership for distribution',
  ]

  const financeSubjects = [
    'Invoice INV-2026-0331 - Payment overdue',
    'Payment reminder - PO-88214',
    'GST invoice for Q2 services',
    'Purchase order clarification',
    'Invoice for annual maintenance',
    'Payment terms discussion',
    'Outstanding invoice follow-up',
    'GST registration update',
    'Vendor billing query',
    'Invoice correction request',
  ]

  const oooSubjects = [
    'Out of Office',
    'OOO until August 15',
    'Away from desk',
    'On leave - limited access',
    'Vacation auto-reply',
    'Currently unavailable',
    'Out of office - back Aug 20',
    'Limited email access',
    'On leave until further notice',
    'Auto-reply: On vacation',
  ]

  const newsletterSubjects = [
    'The B2B Growth Weekly — Issue #212',
    'TechCrunch Daily Digest',
    'Your weekly AI newsletter',
    'Startup Weekly: Top stories',
    'The SaaS Report - August edition',
    'Marketing insights newsletter',
    'Product Hunt Daily',
    'Hacker News digest',
    'Weekly tech roundup',
    'AI & ML Newsletter',
  ]

  const spamSubjects = [
    "Your website isn't ranking on page 1",
    'Free SEO audit for your site',
    'Boost your organic traffic 3x',
    'We can help you rank #1 on Google',
    'Content marketing services',
    'Webinar promotion services',
    'SEO optimization - free consultation',
    'LinkedIn lead generation',
    'Social media management services',
    'Email marketing automation',
  ]

  const triageSubjects = [
    'Meeting follow-up - two requests',
    'Multiple items to discuss',
    'Quick catch-up and proposal',
    'Partnership + enterprise deal',
    'Webinar + product demo request',
    'Two things to discuss',
    'Mixed inquiry - sales and marketing',
    'Combined request - evaluation and event',
    'Multiple topics in one email',
    'Joint venture discussion',
  ]

  const hinglishSubjects = [
    'Product inquiry',
    'Demo chahiye',
    'Partnership baat karein?',
    'Budget discussion',
    'Urgent: Proposal needed',
    'Quick call kab hai?',
    'Invoice pending hai',
    'Sponsorship ke baare mein',
    'New project proposal',
    'Team expansion plans',
  ]

  const rfpBodies = [
    'Dear Team,\n\n{company} invites proposals for an enterprise document management system covering {users} plants and ~{employees} users. Indicative budget is Rs. {budget} lakhs. Proposals must reach us by {deadline}.\n\nRegards,\n{name}\nIT Director, {company}',
    "We are seeking proposals for {company}'s digital transformation initiative. Budget: Rs. {budget} lakhs. Timeline: {deadline}. Please include technical specifications and implementation plan.\n\n{name}\nCTO, {company}",
    'Tender Notice for {company} - Enterprise software procurement. Estimated value: Rs. {budget} lakhs. Last date: {deadline}. All interested vendors please submit sealed bids.\n\n{name}\nProcurement Head, {company}',
    '{company} is looking for a comprehensive ERP solution. Budget allocated: Rs. {budget} lakhs. Interested parties please submit proposals by {deadline}.\n\n{name}\nVP Technology, {company}',
    'Request for proposal for {company} cloud migration project. Budget: Rs. {budget} lakhs. Deadline: {deadline}. Include migration strategy and timeline.\n\n{name}\nDirector IT, {company}',
  ]

  const smbBodies = [
    "Hi,\n\nWe're a {size}-person {industry} startup in {city}. Can we get a demo sometime next week? Nothing urgent.\n\n{name}\nFounder, {company}",
    'Hello,\n\nOur team of {size} people is looking for a {product} solution. Could you schedule a demo? We\'re flexible on timing.\n\n{name}\nCEO, {company}',
    "We're evaluating options for our {size}-person team. Would love to see a demo of your platform. Any availability next week?\n\n{name}\nHead of Operations, {company}",
    "Hi there,\n\nWe're a growing startup with {size} employees. Your product looks interesting. Can we get a walkthrough?\n\n{name}\nCo-founder, {company}",
    'Interested in your platform for our {size}-person team. Please share pricing and schedule a demo.\n\n{name}\nTech Lead, {company}',
  ]

  const marketingBodies = [
    "We're finalising sponsors for the {event} in {city}. Gold tier is ₹{budget} and includes a keynote slot. We need confirmation by {deadline} as we're going to print.\n\n{name}\nSponsorship Lead, {company}",
    "{company} is hosting {event} in {city}. We'd love to have you as a sponsor. Packages start at ₹{budget} lakhs. Please respond by {deadline}.\n\n{name}\nEvent Manager, {company}",
    "We're organising {event} and would like to invite {company} to participate. Sponsorship opportunities available from ₹{budget} lakhs.\n\n{name}\nPartnerships, {company}",
    'Dear {company},\n\nWe\'re seeking sponsors for {event}. Your brand would be a great fit. Budget: ₹{budget} lakhs for gold tier. Deadline: {deadline}.\n\n{name}\nSponsorship Coordinator',
    'Invitation to sponsor {event} in {city}. Silver tier: ₹{budget} lakhs. Includes booth and speaking slot. RSVP by {deadline}.\n\n{name}\nMarketing, {company}',
  ]

  const allianceBodies = [
    "We're a {type} partner across {region} with {clients}+ enterprise clients. We'd like to explore reselling your platform in the region, or a technical integration at minimum. Who handles partnerships?\n\n{name}\nVP Partnerships, {company}",
    'Dear {company},\n\nWe specialize in {type} solutions and would like to discuss a channel partnership. Our client base of {clients}+ enterprises could benefit from your platform.\n\n{name}\nBusiness Development, {company}',
    "We're interested in becoming a reseller for your platform in the {region} market. Currently serving {clients} enterprise clients. Let's discuss.\n\n{name}\nPartnership Lead, {company}",
    '{company} would like to explore technology integration with your platform. We have {clients}+ enterprise clients in {region}.\n\n{name}\nCTO, {company}',
    'Looking to establish a channel partner relationship. We have strong presence in {region} with {clients}+ clients. Interested in reselling your solutions.\n\n{name}\nHead of Alliances, {company}',
  ]

  const financeBodies = [
    'Please find attached invoice INV-{inv_id} for Rs. {amount} (incl. 18% GST) against PO-{po_id}. Kindly process — payment terms were Net 30 and this is now {days} days overdue.\n\n{name}\nAccounts, {company}',
    'Reminder: Invoice INV-{inv_id} for Rs. {amount} is {days} days overdue. Please process payment at earliest.\n\n{name}\nFinance, {company}',
    'Dear {company},\n\nThis is a reminder for outstanding invoice INV-{inv_id} amounting to Rs. {amount}. Payment was due on {due_date}.\n\n{name}\nAccounts Receivable',
    'Invoice for annual maintenance services: Rs. {amount}. PO reference: PO-{po_id}. Please process within 30 days.\n\n{name}\nFinance, {company}',
    'Payment reminder for Q2 services. Invoice amount: Rs. {amount}. GSTIN updated. Please process.\n\n{name}\nAccounts, {company}',
  ]

  const oooBodies = [
    'I am out of office until {return_date} with limited access to email. For urgent matters please contact my colleague at {contact}.\n\nSent from Outlook',
    'Thank you for your email. I am currently on leave until {return_date}. I will respond to your message upon my return.\n\nBest regards,\n{name}',
    'I am away from the office and will return on {return_date}. For urgent queries, please reach out to {contact}.\n\nAuto-reply',
    'On vacation until {return_date}. No email access. For emergencies, contact {contact}.\n\n{name}',
    'Currently on leave. Will be back on {return_date}. Limited email access during this period.\n\n{name}',
  ]

  const newsletterBodies = [
    "In this edition: why PLG is stalling, 5 pricing experiments that worked, and a teardown of Figma's onboarding.\n\n[Unsubscribe] [View in browser]",
    'Top stories today: AI regulation updates, funding rounds, and product launches. Read more at our website.\n\n[Unsubscribe]',
    "Your weekly digest of tech news, startup stories, and product insights. Don't miss our featured article on AI in enterprise.\n\n[Unsubscribe] [Email preferences]",
    'This week in tech: Major funding announcements, new product launches, and industry analysis.\n\n[Unsubscribe]',
    'Newsletter: Latest trends in B2B SaaS, growth hacking tips, and startup advice.\n\n[Unsubscribe] [View in browser]',
  ]

  const spamBodies = [
    "Hi,\n\nI noticed your website isn't ranking on page 1 for key terms. We've helped 200+ SaaS companies 3x their organic traffic. We do content marketing, PR outreach, and webinar promotion. Free audit attached — interested in a quick 15 min call?\n\n{Name}\nGrowth Team, {company}",
    'We can help you rank #1 on Google. Our proven SEO strategies have delivered results for 500+ companies. Free consultation available.\n\nInterested in a quick call?',
    "Boost your organic traffic by 300% in 90 days. Our content marketing and SEO services are designed for B2B companies.\n\nLet's schedule a 15-minute demo.",
    'We specialize in LinkedIn lead generation for B2B companies. Our clients see 5x ROI. Free audit available.\n\nInterested?',
    "Webinar promotion services to 10x your attendance. We've helped 300+ companies run successful webinars.\n\nFree consultation available.",
  ]

  const triageBodies = [
    "Hi — we met at your booth in Mumbai. Two things: (1) we'd like to evaluate your platform for our 800-person org, budget TBD but likely significant, and (2) our CMO wants to co-host a webinar with your team in September. Can you loop in the right people?\n\n{name}\nVP Strategy, {company}",
    "We have two requests: first, we need a demo of your enterprise platform for our 500-person team. Second, our marketing team wants to discuss a content collaboration. Who should we connect with?\n\n{name}\nCOO, {company}",
    'Multiple items: (1) Pricing for 200 users, (2) Integration with our existing CRM, (3) Potential sponsorship of our annual conference. Please route to appropriate teams.\n\n{name}\nDirector, {company}',
    "We're interested in two things: evaluating your product for our team of 300, and exploring a partnership opportunity. Budget for product: Rs. 50 lakhs. Partnership: TBD.\n\n{name}\nVP Sales, {company}",
    'Two requests in one: (1) Demo for our 150-person org, (2) Our CMO wants to co-host a webinar. Different teams handle these, I assume?\n\n{name}\nHead of Strategy, {company}',
  ]

  const hinglishBodies = [
    'Bhai, humko aapka product chahiye for our dealer network. Around {size} users honge. Budget approx {budget} cr allocated hai for this FY. Kab connect kar sakte hain? Thoda jaldi, board review {deadline} ko hai.\n\n{name}\n{company}',
    'Humari company mein {size} log hain. Aapka product dekhna chahte hain. Demo mil sakta hai kya? Budget {budget} lakhs hai.\n\n{name}\n{company}',
    'Partnership ke baare mein baat karni hai. Hum {region} mein {clients}+ clients hain. Reseller banna chahte hain.\n\n{name}\n{company}',
    'Invoice pending hai bahut din se. Rs. {amount} ka payment karna hai. PO-{po_id} reference hai. Jaldi process karo please.\n\n{name}\n{company}',
    'Sponsorship ka proposal hai. {event} mein participate karna hai. Budget {budget} lakhs hai. Kitna chahiye?\n\n{name}\n{company}',
  ]

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
  }

  const emails = []
  let id = 1

  const distribution = {
    rfp: 40,
    smb: 35,
    marketing: 25,
    alliances: 15,
    finance: 25,
    ooo: 30,
    newsletter: 30,
    spam: 30,
    triage: 10,
    hinglish: 10,
  }

  for (const [type, count] of Object.entries(distribution)) {
    for (let i = 0; i < count; i++) {
      const company = pickRandom(companies)
      const firstName = pickRandom(firstNames)
      const lastName = pickRandom(lastNames)
      const name = `${firstName} ${lastName}`
      const day = Math.floor(Math.random() * 28) + 1
      const month = Math.floor(Math.random() * 2) + 8 // Aug or Sep
      const hour = Math.floor(Math.random() * 12) + 8
      const minute = Math.floor(Math.random() * 60)
      const budget = Math.floor(Math.random() * 50) + 5
      const users = Math.floor(Math.random() * 2000) + 50
      const size = Math.floor(Math.random() * 500) + 10
      const amount = Math.floor(Math.random() * 500000) + 50000
      const deadline = `${Math.floor(Math.random() * 20) + 10}th August 2026`

      let subject, body
      switch (type) {
        case 'rfp':
          subject = pickRandom(rfpSubjects)
          body = pickRandom(rfpBodies)
            .replace('{company}', company.name).replace('{users}', Math.floor(users / 100))
            .replace('{employees}', users).replace('{budget}', budget)
            .replace('{deadline}', deadline).replace('{name}', name)
          break
        case 'smb':
          subject = pickRandom(smbSubjects)
          body = pickRandom(smbBodies)
            .replace('{size}', size).replace('{industry}', 'logistics')
            .replace('{city}', 'Pune').replace('{name}', name)
            .replace('{company}', company.name).replace('{product}', 'analytics')
          break
        case 'marketing':
          subject = pickRandom(marketingSubjects)
          body = pickRandom(marketingBodies)
            .replace('{event}', 'India Tech Summit').replace('{city}', 'Bengaluru')
            .replace('{budget}', budget).replace('{deadline}', deadline)
            .replace('{name}', name).replace('{company}', company.name)
          break
        case 'alliances':
          subject = pickRandom(allianceSubjects)
          body = pickRandom(allianceBodies)
            .replace('{type}', 'Salesforce').replace('{region}', 'MEA')
            .replace('{clients}', Math.floor(Math.random() * 100) + 20)
            .replace('{name}', name).replace('{company}', company.name)
          break
        case 'finance':
          subject = pickRandom(financeSubjects)
          body = pickRandom(financeBodies)
            .replace('{inv_id}', `2026-${String(Math.floor(Math.random() * 999) + 1).padStart(4, '0')}`)
            .replace('{po_id}', String(Math.floor(Math.random() * 99999) + 10000))
            .replace('{amount}', amount.toLocaleString('en-IN'))
            .replace('{days}', Math.floor(Math.random() * 30) + 5)
            .replace('{due_date}', `01-${month}-2026`)
            .replace('{name}', name).replace('{company}', company.name)
          break
        case 'ooo':
          subject = pickRandom(oooSubjects)
          body = pickRandom(oooBodies)
            .replace('{return_date}', '14th August 2026')
            .replace('{contact}', `${firstName.toLowerCase()}@colleague.com`)
            .replace('{name}', name)
          break
        case 'newsletter':
          subject = pickRandom(newsletterSubjects)
          body = pickRandom(newsletterBodies)
          break
        case 'spam':
          subject = pickRandom(spamSubjects)
          body = pickRandom(spamBodies)
            .replace('{company}', company.name).replace('{Name}', name)
          break
        case 'triage':
          subject = pickRandom(triageSubjects)
          body = pickRandom(triageBodies)
            .replace('{name}', name).replace('{company}', company.name)
          break
        case 'hinglish':
          subject = pickRandom(hinglishSubjects)
          body = pickRandom(hinglishBodies)
            .replace('{size}', size).replace('{budget}', budget)
            .replace('{deadline}', '20th').replace('{name}', name)
            .replace('{company}', company.name).replace('{region}', 'North India')
            .replace('{clients}', Math.floor(Math.random() * 50) + 10)
            .replace('{amount}', amount.toLocaleString('en-IN'))
            .replace('{po_id}', String(Math.floor(Math.random() * 99999) + 10000))
            .replace('{event}', 'Tech Conference')
          break
      }

      const threadId = type === 'rfp' && i < 3 ? 'th_001' : `th_${String(id).padStart(4, '0')}`
      const isReply = type === 'rfp' && i === 3

      emails.push({
        email_id: `em_${String(id).padStart(5, '0')}`,
        thread_id: threadId,
        message_index: isReply ? 1 : 0,
        from_name: name,
        from_email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.domain}`,
        to: 'sales@company.com',
        cc: i % 5 === 0 ? [`procurement@${company.domain}`] : [],
        subject: isReply ? `RE: ${subject}` : subject,
        body: isReply
          ? `Correction to our earlier note — the board has approved an increased budget of Rs. ${
              budget + 10
            } lakhs.\n\nRegards,\n${name}`
          : body,
        received_at: `2026-08-${String(day).padStart(2, '0')}T${String(hour).padStart(
          2,
          '0'
        )}:${String(minute).padStart(2, '0')}:00+05:30`,
        attachments:
          type === 'rfp' ? ['RFP_document.pdf'] : type === 'finance' ? ['invoice.pdf'] : [],
        is_reply: isReply,
      })
      id++
    }
  }

  return emails
}

function IngestTab({ apiBase, onIngestResult }) {
  const [jsonInput, setJsonInput] = useState('')
  const [parsedEmails, setParsedEmails] = useState([])
  const [ingestResult, setIngestResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleParse = () => {
    try {
      const data = JSON.parse(jsonInput)
      const emails = Array.isArray(data) ? data : data.emails || [data]
      setParsedEmails(emails)
      setError(null)
    } catch (e) {
      setError('Invalid JSON: ' + e.message)
    }
  }

  const handleGenerateSample = () => {
    const samples = generateSampleEmails()
    setJsonInput(JSON.stringify(samples.slice(0, 20), null, 2))
    setParsedEmails(samples)
    setError(null)
  }

  const handleIngest = async () => {
    if (parsedEmails.length === 0) {
      setError('No emails to ingest')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const batch = parsedEmails.slice(0, 100)
      const response = await fetch(`${apiBase}/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: 'priya.sharma@gmail.com',
          emails: batch,
        }),
      })
      const result = await response.json()
      setIngestResult(result)
      onIngestResult?.(result)
    } catch (e) {
      setError('Ingest failed: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const resultCards = [
    {
      label: 'Processed',
      value: ingestResult?.processed,
      icon: <IconInbox className="h-5 w-5 text-red-300" />,
    },
    {
      label: 'Tasks Created',
      value: ingestResult?.tasks_created,
      icon: <IconCheck className="h-5 w-5 text-emerald-300" />,
    },
    {
      label: 'Tasks Updated',
      value: ingestResult?.tasks_updated,
      icon: <IconRefresh className="h-5 w-5 text-blue-300" />,
    },
    {
      label: 'Skipped',
      value: ingestResult?.skipped,
      icon: <IconClock className="h-5 w-5 text-yellow-300" />,
    },
    {
      label: 'Errors',
      value: ingestResult?.errors?.length || 0,
      icon: <IconAlert className="h-5 w-5 text-red-300" />,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Ingest card */}
      <SpotlightCard>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <IconInbox className="h-5 w-5 text-red-300" />
              Paste Email JSON
            </h2>
            <p className="text-xs text-slate-400">Generate a realistic batch or paste your own</p>
          </div>
          <div className="flex gap-2">
            <ShimmerButton onClick={handleGenerateSample} className="flex items-center gap-2">
              <IconZap className="h-4 w-4" />
              Generate 250 Sample Emails
            </ShimmerButton>
            <button
              onClick={handleParse}
              className="rounded-xl border border-white/10 bg-white/[0.05] px-5 py-2.5 text-sm font-semibold text-slate-200 transition-all hover:border-white/25 hover:bg-white/[0.1] hover:text-white"
            >
              Parse JSON
            </button>
          </div>
        </div>

        <div className="p-6">
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="h-64 w-full resize-y rounded-xl border border-white/10 bg-black/30 p-4 font-mono text-xs leading-relaxed text-slate-300 placeholder-slate-600 outline-none backdrop-blur-sm transition-colors focus:border-red-400/60 focus:ring-2 focus:ring-red-500/20"
            placeholder='[{"email_id": "em_001", "thread_id": "th_001", ...}]'
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-1.5 text-sm text-slate-300">
              <span className="font-semibold text-white">{parsedEmails.length}</span> emails parsed
            </span>
            <ShimmerButton
              onClick={handleIngest}
              disabled={loading || parsedEmails.length === 0}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Processing…
                </>
              ) : (
                <>
                  <IconZap className="h-4 w-4" />
                  Submit for Ingestion
                </>
              )}
            </ShimmerButton>
          </div>
        </div>

        {error && (
          <div className="mx-6 mb-6 flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <IconAlert className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
      </SpotlightCard>

      {/* Results */}
      {ingestResult && (
        <div className="animate-fade-up">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Ingestion Results</h2>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-0.5 text-xs font-medium text-emerald-300">
              complete
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {resultCards.map((card) => (
              <MagicCard key={card.label} className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    {card.label}
                  </p>
                  {card.icon}
                </div>
                <NumberTicker
                  value={card.value || 0}
                  className="mt-2 block text-3xl font-bold text-white"
                />
              </MagicCard>
            ))}
          </div>
        </div>
      )}

      {/* Raw emails */}
      {parsedEmails.length > 0 && (
        <SpotlightCard>
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <IconFile className="h-5 w-5 text-orange-300" />
              Raw Email Data
              <span className="text-sm font-normal text-slate-500">({parsedEmails.length} emails)</span>
            </h2>
          </div>
          <div className="max-h-96 overflow-auto">
            <table className="min-w-full divide-y divide-white/[0.06]">
              <thead className="sticky top-0 z-10 bg-[#0b0b1a]/95 backdrop-blur-sm">
                <tr className="text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-3">From</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Subject</th>
                  <th className="px-6 py-3">Received</th>
                  <th className="px-6 py-3">Thread</th>
                  <th className="px-6 py-3">Body Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {parsedEmails.slice(0, 50).map((email, idx) => (
                  <tr key={email.email_id || idx} className="transition-colors hover:bg-white/[0.04]">
                    <td className="px-6 py-3 text-sm text-slate-200">{email.from_name}</td>
                    <td className="px-6 py-3 text-sm text-slate-500">{email.from_email}</td>
                    <td className="max-w-xs truncate px-6 py-3 text-sm text-slate-300">
                      {email.subject}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-500">
                      {email.received_at?.split('T')[0]}
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-slate-500">{email.thread_id}</td>
                    <td className="max-w-md truncate px-6 py-3 text-sm text-slate-500">
                      {email.body?.substring(0, 100)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {parsedEmails.length > 50 && (
            <div className="border-t border-white/[0.06] py-3 text-center text-xs text-slate-500">
              Showing 50 of {parsedEmails.length} emails
            </div>
          )}
        </SpotlightCard>
      )}

      {/* Marquee strip */}
      <Marquee className="pointer-events-none opacity-60">
        {[
          'Gemini 2.5 Flash · classification',
          'SQLite · WAL mode',
          'candidate_id isolation',
          'thread reconciliation',
          'idempotent ingestion',
          'LLM-powered chat',
        ].map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-slate-400"
          >
            <IconSparkles className="h-3 w-3 text-red-400" />
            {tag}
          </span>
        ))}
      </Marquee>
    </div>
  )
}

export default IngestTab
