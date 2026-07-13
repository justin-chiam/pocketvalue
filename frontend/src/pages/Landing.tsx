import { useEffect, useRef, useState } from 'react'
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
          <a
            href="https://github.com/justin-chiam/pocketvalue/blob/main/README.md#backend-setup"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-cta"
          >
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
            <a
              href="https://github.com/justin-chiam/pocketvalue/blob/main/README.md#backend-setup"
              target="_blank"
              rel="noopener noreferrer"
              className="cta"
            >
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
        <a
          href="https://github.com/justin-chiam/pocketvalue/blob/main/README.md#backend-setup"
          target="_blank"
          rel="noopener noreferrer"
          className="cta"
        >
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
