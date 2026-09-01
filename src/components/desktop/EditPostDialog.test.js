import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import EditPostDialog from './EditPostDialog';
import { ref, update } from 'firebase/database';

const mockTranslate = (key) => key;

jest.mock('firebase/database', () => ({
  ref: jest.fn(() => 'post-ref'),
  update: jest.fn(),
}));

jest.mock('../../fb', () => ({ db: {} }));

jest.mock('../../context/LanguageContext', () => ({
  useLanguage: () => ({ t: mockTranslate }),
}));

const post = { id: 'post-1', companyId: 'company-1', description: 'Texto original' };

describe('EditPostDialog', () => {
  beforeEach(() => {
    ref.mockReturnValue('post-ref');
    update.mockReset();
    update.mockResolvedValue();
  });

  it('guarda exatamente a descrição editada', async () => {
    const onSave = jest.fn();
    const onClose = jest.fn();
    render(<EditPostDialog open post={post} user={{ id: 'company-1' }} onSave={onSave} onClose={onClose} />);

    fireEvent.change(screen.getByLabelText('postEdit.description'), { target: { value: 'Novo texto seguro' } });
    fireEvent.click(screen.getByRole('button', { name: 'postEdit.save' }));

    await waitFor(() => expect(update).toHaveBeenCalledWith(
      'post-ref',
      expect.objectContaining({ description: 'Novo texto seguro' })
    ));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'Novo texto seguro' })
    ));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('impede gravação por quem não é proprietário', async () => {
    render(<EditPostDialog open post={post} user={{ id: 'another-company' }} onSave={jest.fn()} onClose={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'postEdit.save' }));

    expect(await screen.findByText('postDetail.permissionDenied')).toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();
  });
});
