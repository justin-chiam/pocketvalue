import { useEffect, useState } from 'react'
import {
  ArrowRight,
  ArrowSquareOut,
  ArrowsClockwise,
  ArrowsLeftRight,
  Camera,
  HandHeart,
  Images,
  Recycle,
  Sparkle,
  Tag,
  Wrench,
} from '@phosphor-icons/react'
import '@fontsource-variable/bricolage-grotesque/index.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import './Landing.css'

const CHAPTERS = [
  {
    num: '01',
    title: 'Point it at anything.',
    sub: 'The camera is the whole interface.',
    body: 'No model numbers, no manual lookups. Guided shots of the front, the back, and the About screen are all it takes.',
  },
  {
    num: '02',
    title: 'Get the full read.',
    sub: 'Model, specs, condition, value. In seconds.',
    body: 'AI fills in the whole device report — model, RAM, storage, battery health, condition — and prices it against the real market. Every field stays editable, and the estimate updates as you correct it.',
  },
  {
    num: '03',
    title: 'See every route, priced.',
    sub: 'Repair, resell, trade in, donate, recycle. Side by side.',
    body: 'Five cards, one per route, each written for your exact device. The best one carries the badge, so the decision makes itself.',
  },
  {
    num: '04',
    title: 'Walk away with a plan.',
    sub: 'One tap from decided to done.',
    body: 'Pick a route and the work is already done: a ready-to-post Marketplace listing, a costed repair plan, or real drop-off spots near you.',
  },
]

const OUTCOMES = [
  {
    icon: Wrench,
    title: 'Repair',
    body: 'A new battery beats a new phone. Small fixes buy years.',
  },
  {
    icon: Tag,
    title: 'Resell',
    body: 'Still works? Someone wants it, and it is worth more than you think.',
  },
  {
    icon: ArrowsLeftRight,
    title: 'Trade in',
    body: 'Put its value toward the next one. We check the offer is actually fair.',
  },
  {
    icon: HandHeart,
    title: 'Donate',
    body: 'A slow laptop for you is a first laptop for someone else.',
  },
  {
    icon: Recycle,
    title: 'Recycle',
    body: 'Truly done? Its metals and minerals are not. Recover them properly.',
  },
]

const CONTRASTS = [
  {
    claim: 'Any brand, any device',
    them: 'Trade-in programs only see their own products.',
    us: 'If it has a shape, we can read it. Ten-year-old laptops included.',
  },
  {
    claim: 'Every route, compared',
    them: 'A trade-in quote is one number from one buyer.',
    us: 'We weigh repair, resale, donation, and recycling against each other and show our work.',
  },
  {
    claim: 'Advice, not a funnel',
    them: 'Marketplaces want a listing. Trade-ins want you upgrading.',
    us: 'We are happiest when the answer is: keep it. That is the whole point.',
  },
]

function useReveal() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const els = document.querySelectorAll('.landing [data-reveal]')
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in')
            io.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -48px 0px' },
    )
    els.forEach((el) => {
      el.classList.add('will-reveal')
      io.observe(el)
    })
    return () => io.disconnect()
  }, [])
}

function useActiveChapter() {
  const [active, setActive] = useState(0)
  useEffect(() => {
    const chapters = document.querySelectorAll('.landing .chapter')
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(Number((entry.target as HTMLElement).dataset.index))
          }
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    chapters.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
  return active
}

function ScreenViewfinder() {
  return (
    <div className="scr-vf">
      <span className="vf-device">
        <span className="vf-cam" />
      </span>
      <span className="vf-hint">Take a photo of the back of the device</span>
      <span className="vf-thumb" />
      <span className="vf-flip">
        <ArrowsClockwise size={20} weight="bold" aria-hidden="true" />
      </span>
      <span className="vf-shutter" />
    </div>
  )
}

function ScreenReport() {
  return (
    <div className="scr-cam-bg">
      <div className="scr-sheet">
        <span className="sheet-grab" />
        <p className="scr-title">Device report</p>
        <div className="field-group">
          <span className="field-label">Photos</span>
          <div className="report-photos">
            <figure>
              <span className="photo-thumb pt-front" />
              <figcaption>Front</figcaption>
            </figure>
            <figure>
              <span className="photo-thumb pt-back" />
              <figcaption>Back</figcaption>
            </figure>
            <figure>
              <span className="photo-thumb pt-about" />
              <figcaption>About screen</figcaption>
            </figure>
          </div>
        </div>
        <div className="field-group">
          <span className="field-label">Model</span>
          <span className="field">OnePlus 15</span>
        </div>
        <div className="field-pair">
          <div className="field-group">
            <span className="field-label">RAM (GB)</span>
            <span className="field">16</span>
          </div>
          <div className="field-group">
            <span className="field-label">Storage (GB)</span>
            <span className="field">512</span>
          </div>
        </div>
        <div className="field-group">
          <span className="field-label">Battery health (%)</span>
          <span className="field">85</span>
        </div>
        <div className="field-group">
          <span className="field-label">Condition</span>
          <span className="cond-track">
            <i className="cond-dot" />
          </span>
          <div className="cond-labels">
            <span>Poor</span>
            <span className="cur">Good</span>
            <span>Excellent</span>
            <span>New</span>
          </div>
        </div>
        <div className="field-group">
          <span className="field-label">Description</span>
          <span className="field field-desc">
            Visible smudges, no cracks. Clean back.
          </span>
        </div>
        <div className="field-group">
          <span className="field-label">Estimated resale value (AUD)</span>
          <p className="scr-value">$750&ndash;$950</p>
        </div>
        <div className="sheet-actions">
          <span className="btn-quiet">Start over</span>
          <span className="btn-solid">Continue</span>
        </div>
      </div>
    </div>
  )
}

function ScreenRecommend() {
  return (
    <div className="scr-pane rec-pane">
      <div className="rec-top">
        <span className="rec-back">&lsaquo; Back</span>
        <span className="rec-restart">Start over</span>
      </div>
      <p className="scr-title">What should you do with it?</p>
      <div className="rec-card">
        <div className="rec-card-head">
          <Tag size={24} aria-hidden="true" />
          <em>Recommended</em>
        </div>
        <p className="rec-card-title">Resell</p>
        <p className="rec-card-body">
          Selling your OnePlus 15 privately is likely the best option, with an
          estimated resale value of A$750&ndash;A$950 in its current good
          condition. Be transparent about the 85% battery health.
        </p>
        <span className="rec-link">View full breakdown &rsaquo;</span>
      </div>
      <div className="rec-dots">
        <i />
        <i className="on" />
        <i />
        <i />
        <i />
      </div>
    </div>
  )
}

function ScreenListing() {
  return (
    <div className="scr-pane listing-pane">
      <div className="listing-top">
        <span className="listing-close">Close</span>
        <span className="listing-copyall">Copy all</span>
      </div>
      <p className="scr-title">Your Marketplace listing</p>
      <p className="listing-sub">
        Copy each field into Facebook. Everything is based on the device
        details you reviewed.
      </p>
      <div className="field-group">
        <span className="field-label">Why sell</span>
        <i className="skel" style={{ width: '100%' }} />
        <i className="skel" style={{ width: '72%' }} />
      </div>
      <div className="copy-field">
        <div>
          <span className="copy-label">Title</span>
          <p>OnePlus 15 &middot; 512GB &middot; good</p>
        </div>
        <span className="copy-btn">Copy</span>
      </div>
      <div className="copy-field">
        <div>
          <span className="copy-label">Price (AUD)</span>
          <p>$950</p>
        </div>
        <span className="copy-btn">Copy</span>
      </div>
      <div className="copy-field">
        <div>
          <span className="copy-label">Category</span>
          <p>Mobile phones</p>
        </div>
        <span className="copy-btn">Copy</span>
      </div>
      <div className="copy-field">
        <div>
          <span className="copy-label">Description</span>
          <p className="copy-desc">
            Well-kept OnePlus 15, 16GB/512GB, 85% battery. No cracks or
            scratches.
          </p>
        </div>
        <span className="copy-btn">Copy</span>
      </div>
      <div className="photo-card">
        <div className="photo-card-head">
          <span className="photo-card-icon">
            <Images size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="photo-card-title">Add a few buyer-friendly photos</p>
            <p className="photo-card-sub">3 scan photos taken</p>
          </div>
        </div>
        <span className="photo-card-btn">Save scan photos</span>
      </div>
      <span className="btn-solid listing-cta">
        Go to Facebook Marketplace
        <ArrowSquareOut size={17} weight="bold" aria-hidden="true" />
      </span>
      <p className="listing-note">
        Facebook opens separately. You&rsquo;ll review and publish there.
      </p>
    </div>
  )
}

const SCREENS = [ScreenViewfinder, ScreenReport, ScreenRecommend, ScreenListing]

function Iphone({ active }: { active: number }) {
  return (
    <div className="iphone" data-screen={active} aria-hidden="true">
      <div className="device device-iphone-14-pro">
        <div className="device-frame">
          <div className="device-screen">
            {SCREENS.map((Screen, i) => (
              <div key={i} className={i === active ? 'scr on' : 'scr'}>
                <Screen />
              </div>
            ))}
            <div className="iphone-status">
              <span className="status-time">9:41</span>
              <span className="status-icons">
                <svg width="19" height="12" viewBox="0 0 19 12" aria-hidden="true">
                  <rect x="0" y="7" width="3.4" height="5" rx="1.1" fill="currentColor" />
                  <rect x="5.2" y="4.6" width="3.4" height="7.4" rx="1.1" fill="currentColor" />
                  <rect x="10.4" y="2.3" width="3.4" height="9.7" rx="1.1" fill="currentColor" />
                  <rect x="15.6" y="0" width="3.4" height="12" rx="1.1" fill="currentColor" />
                </svg>
                <svg width="17" height="12" viewBox="0 0 17 12" fill="none" aria-hidden="true">
                  <path
                    d="M1.9 4.3a10.4 10.4 0 0 1 13.2 0"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M4.6 7.2a6.3 6.3 0 0 1 7.8 0"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="8.5" cy="10.3" r="1.7" fill="currentColor" />
                </svg>
                <svg width="26" height="12" viewBox="0 0 26 12" fill="none" aria-hidden="true">
                  <rect
                    x="0.5"
                    y="0.5"
                    width="21.5"
                    height="11"
                    rx="3.3"
                    stroke="currentColor"
                    opacity="0.45"
                  />
                  <rect x="2.3" y="2.3" width="17.9" height="7.4" rx="1.8" fill="currentColor" />
                  <path
                    d="M23.6 4.1v3.8a2.1 2.1 0 0 0 0-3.8Z"
                    fill="currentColor"
                    opacity="0.45"
                  />
                </svg>
              </span>
            </div>
            <span className="home-bar" />
          </div>
        </div>
        <div className="device-stripe" />
        <div className="device-header" />
        <div className="device-sensors" />
        <div className="device-btns" />
        <div className="device-power" />
        <div className="device-home" />
      </div>
    </div>
  )
}

function Landing() {
  useReveal()
  const active = useActiveChapter()

  return (
    <div className="landing">
      <header className="nav">
        <div className="nav-inner">
          <span className="wordmark">PocketValue</span>
          <a href="#how" className="nav-cta">
            Try it
          </a>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <h1>
            Your old tech isn't dead.
            <br />
            It's <em>undecided.</em>
          </h1>
          <p className="hero-sub">
            Photograph any device. AI identifies it, grades its condition, and
            finds your old tech a new home: repair, resell, trade in, donate,
            or recycle.
          </p>
          <div className="hero-actions">
            <a href="#how" className="cta">
              Try it
              <ArrowRight weight="bold" aria-hidden="true" />
            </a>
            <a href="#how" className="cta-quiet">
              How it works
            </a>
          </div>
        </div>

        <aside className="ticket" aria-label="Example device report">
          <div className="ticket-head">
            <span className="ticket-label">
              <Sparkle weight="fill" aria-hidden="true" /> Device report
            </span>
            <span className="ticket-label">Example</span>
          </div>
          <p className="ticket-device">iPhone 11, 64&thinsp;GB</p>
          <p className="ticket-year">Released 2019. Photographed today.</p>
          <dl className="ticket-rows">
            <div>
              <dt>Condition</dt>
              <dd>
                <span className="grade">Good</span> Worn battery, clean screen
              </dd>
            </div>
            <div>
              <dt>Resale value</dt>
              <dd>$110 to $140</dd>
            </div>
            <div>
              <dt>Battery swap</dt>
              <dd>around $49</dd>
            </div>
          </dl>
          <div className="ticket-verdict">
            <span className="stamp">Keep it</span>
            <p>
              Best route: <strong>repair</strong>. A $49 battery gets you two more years. You don't need a new phone.
            </p>
          </div>
        </aside>
      </section>

      <section className="problem" data-reveal>
        <div className="container">
          <h2>
            Working tech gets thrown out because deciding what to do with it is a
            chore.
          </h2>
          <p className="problem-body">
            So it sits in a drawer, then quietly becomes waste. Not because it
            was broken, but because nobody had an hour to figure out its worth.
          </p>
          <div className="stats">
            <div className="stat">
              <span className="stat-figure">62M</span>
              <span className="stat-label">
                tonnes of e-waste generated in a single year
              </span>
            </div>
            <div className="stat">
              <span className="stat-figure">&lt;25%</span>
              <span className="stat-label">
                formally collected and recycled
              </span>
            </div>
            <div className="stat">
              <span className="stat-figure">1 hr</span>
              <span className="stat-label">
                research per device. That's the real barrier we remove.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="story-intro" id="how">
        <h2 data-reveal>Three photos do the work.</h2>
      </section>

      <section className="story">
        <div className="story-sticky">
          <Iphone active={active} />
        </div>
        <div className="chapters">
          {CHAPTERS.map((c, i) => (
            <div className="chapter" data-index={i} key={c.num}>
              <div className="chapter-copy">
                <span className="chapter-num">{c.num}</span>
                <h3>{c.title}</h3>
                <p className="chapter-sub">{c.sub}</p>
                <p className="chapter-body">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="outcomes">
        <div className="container">
          <h2 data-reveal>Five actions you can take.</h2>
          <p className="section-sub" data-reveal>
            We rank every route for your exact device and tell you which one
            wins, and why.
          </p>
          <div className="outcome-grid">
            {OUTCOMES.map((o, i) => (
              <article
                key={o.title}
                className="outcome"
                data-reveal
                style={{ '--d': `${i * 80}ms` } as React.CSSProperties}
              >
                <o.icon size={28} weight="light" aria-hidden="true" />
                <h3>{o.title}</h3>
                <p>{o.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="different">
        <div className="container">
          <h2 data-reveal>Trade-in programs work for the brand. This works for the device.</h2>
          <div className="contrast-rows">
            {CONTRASTS.map((row, i) => (
              <div
                className="contrast"
                key={row.claim}
                data-reveal
                style={{ '--d': `${i * 80}ms` } as React.CSSProperties}
              >
                <h3>{row.claim}</h3>
                <p className="them">{row.them}</p>
                <p className="us">{row.us}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="closing" data-reveal>
        <Camera size={40} weight="light" aria-hidden="true" />
        <h2>Open the drawer. Point the camera.</h2>
        <a href="#how" className="cta">
          Try it
          <ArrowRight weight="bold" aria-hidden="true" />
        </a>
      </section>

      <footer className="footer">
        <span className="wordmark">PocketValue</span>
        <p>Built at the 2026 CSESoc Flagship Hackathon</p>
      </footer>
    </div>
  )
}

export default Landing
