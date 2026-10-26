import { useRoute } from './lib/router';
import { getCategory } from './data';
import Home from './components/Home';
import CategoryPage from './components/CategoryPage';
import Quiz, { type QuizMode } from './components/Quiz';
import Flashcards from './components/Flashcards';
import { LangContext } from './lib/langContext';
import { getPack } from './lib/lang';

export default function App() {
  const [page, catId, sub, extra] = useRoute();
  const cat = catId ? getCategory(catId) : undefined;

  let content;
  if (page === 'c' && cat) content = <CategoryPage key={cat.id} category={cat} tab={sub ?? 'grammar'} topic={extra} />;
  else if (page === 'quiz' && cat) content = <Quiz key={`${cat.id}-${sub}`} category={cat} mode={(sub as QuizMode) ?? 'mixed'} />;
  else if (page === 'cards' && cat) content = <Flashcards key={cat.id} category={cat} />;
  else content = <Home />;

  return (
    <div className="app">
      <header className="topbar">
        <a href="#/" className="brand">
          <span className="brand-mark">Aa</span> Powtórki
        </a>
      </header>
      <LangContext.Provider value={getPack(cat?.language ?? 'ro')}>
        <main className="container">{content}</main>
      </LangContext.Provider>
    </div>
  );
}
