import { Link } from 'react-router-dom'
import './Landing.css'

interface Step {
  title: string
  body: string
}

const STEPS: Step[] = [
  {
    title: 'Snap a photo',
    body: 'Point your camera at the device you want to understand.',
  },
  {
    title: 'Gemini looks it over',
    body: 'We send the image to Gemini, which identifies the device and reads its state.',
  },
  {
    title: 'Get an instant answer',
    body: 'See what it is, what it is doing, and what to do next.',
  },
]

function Landing() {
  return (
    <>
      <section id="hero">
        <h1>Point your camera. Know your device.</h1>
        <p className="tagline">
          Photograph any device and get an instant, plain-language readout —
          powered by Gemini.
        </p>
        <Link to="/app" className="cta">
          Try it
        </Link>
      </section>

      <section id="how-it-works">
        <h2>How it works</h2>
        <ol className="steps">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <span className="step-number">{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}

export default Landing
