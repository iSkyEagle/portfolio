import { describe, expect, it } from 'vitest';
import { applyTheme, nextMode } from './useTheme';

describe('thème', () => {
  it('enchaîne auto, clair, sombre puis revient à auto', () => {
    expect(nextMode('auto')).toBe('clair');
    expect(nextMode('clair')).toBe('sombre');
    expect(nextMode('sombre')).toBe('auto');
  });

  it("pose l'attribut data-theme, et le retire en mode auto", () => {
    const root = document.createElement('html');
    applyTheme('sombre', root);
    expect(root.getAttribute('data-theme')).toBe('dark');
    applyTheme('clair', root);
    expect(root.getAttribute('data-theme')).toBe('light');
    applyTheme('auto', root);
    expect(root.hasAttribute('data-theme')).toBe(false);
  });
});
