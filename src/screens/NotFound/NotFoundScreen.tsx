import { useNavigate } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';
import { Button } from '../../components/Button/Button';
import './NotFoundScreen.css';

export function NotFoundScreen() {
  const navigate = useNavigate();

  return (
    <main className="not-found-main">
      <div className="not-found-container glass-panel">
        <h1 className="not-found-code">404</h1>
        <h2 className="not-found-title">Lost in Latent Space</h2>
        <p className="not-found-desc">
          We couldn't find the page you're looking for. It might have been moved, deleted, or never existed in this realm.
        </p>
        <div className="not-found-actions">
          <Button variant="primary" onClick={() => navigate('/')}>
            <Home size={16} />
            Go Home
          </Button>
          <Button variant="dimmed" onClick={() => navigate('/explore')}>
            <Compass size={16} />
            Explore
          </Button>
        </div>
      </div>
    </main>
  );
}
