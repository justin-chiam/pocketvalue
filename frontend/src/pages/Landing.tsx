import { useEffect, useRef, useState } from 'react'
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
    num: 'STEP 1',
    title: 'Take a picture of your old device.',
    sub: 'Your photos are all PocketValue needs to recognise your device.',
    body: "The front and back photos help PocketValue understand your device's physical condition. The About-page photo adds model and specification details for a more accurate report.",
  },
  {
    num: 'STEP 2',
    title: 'View the device report.',
    sub: 'PocketValue will analyse the model, condition, and value in a few seconds.',
    body: 'PocketValue autofills what it can from its analysis. Complete any missing details, and it checks current Australian second-hand prices to ground the estimated resale range.',
  },
  {
    num: 'STEP 3',
    title: 'Get the best next step for your device.',
    sub: 'Compare repair, resell, trade in, donate, and recycle side by side.',
    body: 'Using the device report, PocketValue weighs all five options and recommends the action that makes the most sense for your device.',
  },
  {
    num: 'STEP 4',
    title: 'Act on your recommendation.',
    sub: 'Everything you need for the next step.',
    body: 'PocketValue gives you repair costs and guides, ready-to-copy listing text, or nearby donation and recycling locations.',
  },
]

const OUTCOMES = [
  {
    icon: Wrench,
    title: 'Repair',
    body: 'Often a cheap part is the only thing wrong. Replace it and the device is good for years.',
  },
  {
    icon: Tag,
    title: 'Resell',
    body: "If it still works, there's a buyer for it, usually at a higher price than you'd guess.",
  },
  {
    icon: ArrowsLeftRight,
    title: 'Trade in',
    body: 'Put its value toward your next device. We check that the offer is actually fair.',
  },
  {
    icon: HandHeart,
    title: 'Donate',
    body: 'The laptop that feels slow to you can be a good first computer for someone who has none.',
  },
  {
    icon: Recycle,
    title: 'Recycle',
    body: "When a device really is finished, the metals inside it aren't. Recycling gets them back.",
  },
]

const CONTRASTS = [
  {
    claim: 'Any brand, any device',
    them: 'Trade-in programs only see their own products.',
    us: 'If you can photograph it, we can assess it, including laptops from ten years ago.',
  },
  {
    claim: 'Every action, compared',
    them: 'A trade-in quote is one number from one buyer.',
    us: 'We weigh the options of repairing, reselling, donating and recycling against each other and show our work.',
  },
  {
    claim: 'Recommending without an agenda',
    them: 'Marketplaces want a listing. Trade-ins want you upgrading.',
    us: 'PocketValue compares all five actions and recommends the one that makes the most sense for your device, rather than the one that pushes you to buy again.',
  },
]

function CountUp({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
}: {
  value: number
  decimals?: number
  prefix?: string
  suffix?: string
}) {
  const elementRef = useRef<HTMLElement>(null)
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [displayValue, setDisplayValue] = useState(prefersReducedMotion ? value : 0)

  useEffect(() => {
    const element = elementRef.current
    if (!element || prefersReducedMotion) return

    let frame = 0
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return

        const startedAt = performance.now()
        const tick = (now: number) => {
          const progress = Math.min((now - startedAt) / 1300, 1)
          const eased = 1 - Math.pow(1 - progress, 4)
          setDisplayValue(Number((value * eased).toFixed(decimals)))

          if (progress < 1) frame = requestAnimationFrame(tick)
        }

        frame = requestAnimationFrame(tick)
        observer.disconnect()
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    )

    observer.observe(element)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [decimals, prefersReducedMotion, value])

  const finalLabel = `${prefix}${value.toFixed(decimals)}${suffix}`

  return (
    <strong ref={elementRef} aria-label={finalLabel}>
      {prefix}{displayValue.toFixed(decimals)}{suffix}
    </strong>
  )
}

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
            Consume less.
            <br />
            Use your tech <em>longer.</em>
          </h1>
          <p className="hero-sub">
            Photograph any device. It identifies the model, grades the
            condition, and tells you the best thing to do with it: repair,
            resell, trade in, donate, or recycle.
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
          </div>
          <p className="ticket-device">iPhone 11, 64&thinsp;GB</p>
          <dl className="ticket-rows">
            <div>
              <dt>Condition</dt>
              <dd className="condition-value">
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
            <span className="stamp">Recommended</span>
            <p>
              Best route: <strong>repair</strong>. A $49 battery gets you two
              more good years. You don't need a new phone.
            </p>
          </div>
        </aside>
      </section>

      <section className="e-waste-stats" data-reveal>
        <div className="container">
          <div className="stats-heading">
            <h2>The scale of e-waste.</h2>
            <ol className="stats-sources" aria-label="Statistics sources">
              <li id="stats-source-1">
                <a
                  href="https://www.itu.int/en/ITU-D/Environment/Pages/Publications/The-Global-E-waste-Monitor-2024.aspx"
                  target="_blank"
                  rel="noreferrer"
                >
                  ITU, Global E-waste Monitor 2024
                </a>
              </li>
              <li id="stats-source-2">
                <a
                  href="https://unitar.org/about/news-stories/press/global-e-waste-monitor-2024-electronic-waste-rising-five-times-faster-documented-e-waste-recycling"
                  target="_blank"
                  rel="noreferrer"
                >
                  UNITAR, Global E-waste Monitor press release
                </a>
              </li>
              <li id="stats-source-3">
                <a
                  href="https://www.itu.int/itu-d/sites/digital-impact-unlocked/improving-global-e-waste-data/"
                  target="_blank"
                  rel="noreferrer"
                >
                  ITU, Improving Global E-waste Data
                </a>
              </li>
              <li id="stats-source-4">
                <a
                  href="https://www.rba.gov.au/statistics/frequency/exchange-rates.html"
                  target="_blank"
                  rel="noreferrer"
                >
                  RBA, daily exchange rates, 10 July 2026
                </a>
              </li>
            </ol>
          </div>
          <div className="e-waste-grid">
            <div className="e-waste-stat">
              <div className="e-waste-value">
                <CountUp value={62} suffix="M" />
              </div>
              <span>
                tonnes of e-waste generated worldwide in 2022
                <sup>
                  <a href="#stats-source-1">1</a>, <a href="#stats-source-2">2</a>
                </sup>
              </span>
            </div>
            <div className="e-waste-stat">
              <div className="e-waste-value">
                <CountUp value={22.3} decimals={1} suffix="%" />
              </div>
              <span>
                documented as formally collected and recycled
                <sup>
                  <a href="#stats-source-1">1</a>, <a href="#stats-source-3">3</a>
                </sup>
              </span>
            </div>
            <div className="e-waste-stat">
              <div className="e-waste-value">
                <CountUp value={89} prefix="≈A$" suffix="B" />
              </div>
              <span>
                in recoverable natural resources went unaccounted for
                <sup>
                  <a href="#stats-source-2">2</a>, <a href="#stats-source-3">3</a>,{' '}
                  <a href="#stats-source-4">4</a>
                </sup>
              </span>
            </div>
            <div className="e-waste-stat">
              <div className="e-waste-value">
                <CountUp value={82} suffix="M" />
              </div>
              <span>
                tonnes of e-waste projected worldwide by 2030
                <sup>
                  <a href="#stats-source-1">1</a>, <a href="#stats-source-2">2</a>
                </sup>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="problem" data-reveal>
        <div className="container">
          <div className="problem-grid">
            <div className="problem-copy">
              <h2>
                <span>Old working tech gets thrown out</span>
                <span>because deciding what to do with it</span>
                <span>is a chore.</span>
              </h2>
              <p className="problem-body">
                So it sits in a drawer, then quietly becomes waste. Not because
                it was broken, but because nobody had an hour to figure out its
                worth. This is exactly what PocketValue solves.
              </p>
            </div>
            <div
              className="research-comparison"
              aria-label="Research time reduced from one hour to five minutes with PocketValue"
            >
              <div className="research-time research-time-normal">
                <span className="research-time-label">Without PocketValue</span>
                <strong>1 hour</strong>
                <span className="research-time-caption">research time per device</span>
              </div>
              <ArrowRight
                className="research-arrow"
                size={30}
                weight="bold"
                aria-hidden="true"
              />
              <div className="research-time research-time-pocketvalue">
                <span className="research-time-label">With PocketValue</span>
                <strong>5 minutes</strong>
                <span className="research-time-caption">research time per device</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="story-intro" id="how">
        <h2 data-reveal>Three photos are all it takes.</h2>
        <ol className="photo-list" data-reveal aria-label="Photos to take">
          <li>
            <span>1</span> Front of the device
          </li>
          <li>
            <span>2</span> Back of the device
          </li>
          <li>
            <span>3</span> About page of the device
          </li>
        </ol>
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
          <h2 data-reveal>Five actions. One recommendation.</h2>
          <p className="section-sub" data-reveal>
            We analyse every route and find the option that maximises the value
            of your old device.
          </p>
          <div className="outcome-grid">
            {OUTCOMES.map((o, i) => (
              <article
                key={o.title}
                className={`outcome${o.title === 'Resell' ? ' recommended' : ''}`}
                data-reveal
                style={{ '--d': `${i * 80}ms` } as React.CSSProperties}
              >
                <div className="outcome-head">
                  <o.icon size={28} weight="light" aria-hidden="true" />
                  {o.title === 'Resell' && (
                    <span className="outcome-badge">Recommended</span>
                  )}
                </div>
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
        <h2>Point your camera at that old device and find out what it's worth.</h2>
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
