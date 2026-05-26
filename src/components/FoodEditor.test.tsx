import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FoodEditor } from './FoodEditor';

describe('FoodEditor', () => {
  it('submits a reviewed food with selected oil', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<FoodEditor onSave={onSave} title="Manual entry" />);

    await user.type(screen.getByLabelText('Food'), 'Rice bowl');
    await user.clear(screen.getByLabelText(/Calories/));
    await user.type(screen.getByLabelText(/Calories/), '250');
    await user.click(screen.getByRole('button', { name: 'Olive' }));
    await user.click(screen.getByRole('button', { name: /Log food/ }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].name).toBe('Rice bowl');
    expect(onSave.mock.calls[0][0].nutrition.calories).toBe(250);
    expect(onSave.mock.calls[0][1]).toEqual({ type: 'olive', amount: 1, unit: 'tsp' });
  });
});

