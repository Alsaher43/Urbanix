import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-brand">
        <Compass className="h-8 w-8" />
      </div>
      <div>
        <p className="text-5xl font-bold tracking-tight text-content">404</p>
        <p className="mt-2 text-content-2">Esta página no existe o fue movida.</p>
      </div>
      <Link to="/">
        <Button>Volver al inicio</Button>
      </Link>
    </div>
  );
}
