import { useEffect, useState } from 'react'
import {
  ArrowRight,
  ArrowsLeftRight,
  BatteryFull,
  Camera,
  HandHeart,
  Recycle,
  Sparkle,
  Tag,
  WifiHigh,
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
    body: 'No model numbers, no dropdowns, no forms. If you can photograph it, PocketValue can assess it.',
  },
  {
    num: '02',
    title: 'Get the full read.',
    sub: 'Model, condition, value. In seconds.',
    body: 'It identifies the exact device, grades condition from the photo, and prices it against the real market.',
  },
  {
    num: '03',
    title: 'See every route, priced.',
    sub: 'Repair, resell, trade in, donate, recycle. Side by side.',
    body: 'Each path gets a number for your exact device, so the decision makes itself.',
  },
  {
    num: '04',
    title: 'Walk away with a plan.',
    sub: 'One verdict, clear next steps.',
    body: 'Not a listing, not a quote. A recommendation you can act on today. Even when that means keeping it.',
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
      <div className="vf-frame">
        <span className="vf-device" />
      </div>
      <span className="vf-chip">Scanning</span>
      <span className="vf-shutter" />
    </div>
  )
}

function ScreenReport() {
  return (
    <div className="scr-pane">
      <span className="scr-pill">Identified</span>
      <p className="scr-title">iPhone 11, 64&thinsp;GB</p>
      <p className="scr-sub">Released 2019</p>
      <div className="scr-rows">
        <div className="scr-row">
          <span>Condition</span>
          <span className="grade-mini">B</span>
        </div>
        <div className="scr-row">
          <span>Market value</span>
          <i className="skel" style={{ width: 76 }} />
        </div>
        <div className="scr-row">
          <span>Repair cost</span>
          <i className="skel" style={{ width: 54 }} />
        </div>
        <div className="scr-row">
          <span>Age</span>
          <i className="skel" style={{ width: 64 }} />
        </div>
      </div>
    </div>
  )
}

function ScreenRoutes() {
  return (
    <div className="scr-pane">
      <p className="scr-title-sm">Your routes</p>
      <div className="route best">
        <Wrench size={19} weight="bold" aria-hidden="true" />
        <span>Repair</span>
        <em>Best</em>
      </div>
      <div className="route">
        <Tag size={19} aria-hidden="true" />
        <span>Resell</span>
        <i className="skel" style={{ width: 46 }} />
      </div>
      <div className="route">
        <ArrowsLeftRight size={19} aria-hidden="true" />
        <span>Trade in</span>
        <i className="skel" style={{ width: 46 }} />
      </div>
      <div className="route">
        <HandHeart size={19} aria-hidden="true" />
        <span>Donate</span>
        <i className="skel" style={{ width: 46 }} />
      </div>
      <div className="route">
        <Recycle size={19} aria-hidden="true" />
        <span>Recycle</span>
        <i className="skel" style={{ width: 46 }} />
      </div>
    </div>
  )
}

function ScreenVerdict() {
  return (
    <div className="scr-pane verdict-pane">
      <span className="stamp stamp-sm">Keep it</span>
      <p className="scr-title-sm">Best route: repair</p>
      <i className="skel" style={{ width: '82%' }} />
      <i className="skel" style={{ width: '58%' }} />
      <span className="scr-btn">Find a repair shop</span>
    </div>
  )
}

const SCREENS = [ScreenViewfinder, ScreenReport, ScreenRoutes, ScreenVerdict]

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
                <WifiHigh size={20} weight="bold" />
                <BatteryFull size={26} weight="fill" />
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
                <span className="grade">B</span> Worn battery, clean screen
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
        <p className="footer-credit">
          Made with <span role="img" aria-label="love">❤️</span> by Justin, Benji, and Lemuel
        </p>
        <p>Built at the 2026 CSESoc Flagship Hackathon</p>
      </footer>
    </div>
  )
}

export default Landing
