import { useState, useRef, useEffect } from "react";
import SpinWheel from "./components/SpinWheel";
import { categoryColors, effortColors, fetchDishes } from "./data/dishes";
import "./App.css";

const EFFORT_LEVELS = ["Låg", "Mellan", "Hög"];

const effortLabels = {
  Låg:    "Låg — snabb & enkel",
  Mellan: "Mellan — lite jobb",
  Hög:    "Hög — ta tid på dig",
};

export default function App() {
  const [dishes, setDishes] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [result, setResult] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [visible, setVisible] = useState(false);
  const [effortFilter, setEffortFilter] = useState(null); // null = Alla
  const resultRef = useRef(null);

  useEffect(() => {
    fetchDishes()
      .then(setDishes)
      .catch(() => setLoadError("Kunde inte ladda maträtter. Försök igen senare."));
  }, []);

  useEffect(() => {
    if (!visible || isSpinning) return;
    const t = setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 80);
    return () => clearTimeout(t);
  }, [visible, isSpinning]);

  function handleResult({ dish, category }) {
    setResult({ dish, category });
    setVisible(true);
  }

  function handleSpinStart(val) {
    setIsSpinning(val);
    if (val) setVisible(false);
  }

  function handleEffortChange(level) {
    setEffortFilter(prev => prev === level ? null : level);
    setVisible(false);
    setResult(null);
  }

  return (
    <div className="page">
      <header className="book-header">
        <div className="header-ornament" aria-hidden="true">✦ ✦ ✦</div>
        <p className="book-series">Middagshjulet</p>
        <h1 className="book-title">Vad ska vi äta ikväll?</h1>
        <p className="book-subtitle">Snurra hjulet — låt slumpen välja din middag</p>
        <div className="header-rule" aria-hidden="true" />
      </header>

      {/* Effort filter */}
      <section className="effort-section" aria-label="Filtrera på arbetsinsats">
        <p className="effort-heading">Arbetsinsats</p>
        <div className="effort-pills" role="group">
          <button
            className={`effort-pill${effortFilter === null ? " active" : ""}`}
            onClick={() => handleEffortChange(null)}
            aria-pressed={effortFilter === null}
          >
            Alla
          </button>
          {EFFORT_LEVELS.map(level => (
            <button
              key={level}
              className={`effort-pill effort-pill--${level.toLowerCase()}${effortFilter === level ? " active" : ""}`}
              onClick={() => handleEffortChange(level)}
              aria-pressed={effortFilter === level}
              title={effortLabels[level]}
            >
              {level}
            </button>
          ))}
        </div>
      </section>

      <section className="wheel-section">
        {loadError ? (
          <p className="load-error">{loadError}</p>
        ) : (
          <SpinWheel
            dishes={dishes}
            onResult={handleResult}
            isSpinning={isSpinning}
            setIsSpinning={handleSpinStart}
            effortFilter={effortFilter}
          />
        )}
      </section>

      <section
        ref={resultRef}
        className={`recipe-card${visible && !isSpinning ? " visible" : ""}`}
        aria-live="polite"
      >
        {result && (
          <>
            <div className="recipe-card-top">
              <span
                className="recipe-category"
                style={{ background: categoryColors[result.category] || "#888" }}
              >
                {result.category}
              </span>
              <span
                className="recipe-effort-badge"
                style={{ background: effortColors[result.dish.effort] || "#888" }}
              >
                {result.dish.effort}
              </span>
            </div>

            <div className="recipe-card-body">
              <p className="recipe-eyebrow">Kvällens förslag</p>
              <h2 className="recipe-title">{result.dish.name}</h2>

              {result.dish.ingredients ? (
                <div className="recipe-ingredients">
                  <p className="ingredients-heading">Ingredienser</p>
                  <p className="ingredients-list">{result.dish.ingredients}</p>
                </div>
              ) : null}
            </div>

            <div className="recipe-card-footer">
              <p className="spin-again-hint">Inte nöjd?&ensp;Snurra igen!</p>
            </div>
          </>
        )}
      </section>

      <footer className="book-footer">
        <div className="footer-ornament" aria-hidden="true">— ✦ —</div>
      </footer>
    </div>
  );
}
