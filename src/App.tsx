import { Route, Routes } from 'react-router';
import { Layout } from './components/Layout';
import { BenchDemo } from './demos/banc/BenchDemo';
import { ReservationDemo } from './demos/reservation/ReservationDemo';
import { Demos } from './pages/Demos';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import { Path } from './pages/Path';
import { Projects } from './pages/Projects';
import { Skills } from './pages/Skills';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="competences" element={<Skills />} />
        <Route path="demos" element={<Demos />} />
        <Route path="demos/reservation" element={<ReservationDemo />} />
        <Route path="demos/banc" element={<BenchDemo />} />
        <Route path="projets" element={<Projects />} />
        <Route path="projets/:id" element={<Projects />} />
        <Route path="parcours" element={<Path />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
