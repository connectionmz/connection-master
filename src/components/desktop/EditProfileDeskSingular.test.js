import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ref, update } from 'firebase/database';
import EditProfileDeskSingular from './EditProfileDeskSingular';

jest.mock('firebase/database', () => ({ ref: jest.fn(), update: jest.fn() }));
jest.mock('../../fb', () => ({ db: {} }));
jest.mock('../../context/LanguageContext', () => ({
  useLanguage: () => ({ t: key => key }),
}));
jest.mock('../password/ChangePassword', () => () => <div>password</div>);
jest.mock('../BackButton', () => () => <button>back</button>);

describe('EditProfileDeskSingular', () => {
  beforeEach(() => {
    ref.mockReturnValue('company-ref');
    update.mockResolvedValue();
  });

  it('atualiza somente os campos visíveis do perfil singular', async () => {
    render(<EditProfileDeskSingular user={{
      id: 'user-1',
      nome: 'Nome antigo',
      contacto: '841234567',
      endereco: 'Maputo',
      bio: 'não deve ser gravada',
      social: { facebook: 'não deve ser gravado' },
    }} />);

    fireEvent.change(screen.getByRole('textbox', { name: /profileEdit\.name/ }), {
      target: { value: ' Novo nome ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'profileEdit.save' }));

    await waitFor(() => expect(update).toHaveBeenCalledWith('company-ref', {
      nome: 'Novo nome',
      contacto: '841234567',
      endereco: 'Maputo',
    }));
  });
});
