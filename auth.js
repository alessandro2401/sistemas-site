/**
 * Sistema de Autenticação - Sistemas Administradora Mutual
 * Biblioteca de autenticação com localStorage para site HTML estático
 */

// Usuários master do sistema
const MASTER_USERS = [
    {
        email: 'presidencia@administradoramutual.com.br',
        password: '1234567890',
        name: 'Presidência',
        level: 'Master'
    },
    {
        email: 'diretoria@administradoramutual.com.br',
        password: '1234567890',
        name: 'Diretoria',
        level: 'Master'
    },
    {
        email: 'comercial@administradoramutual.com.br',
        password: '1234567890',
        name: 'Comercial',
        level: 'Master'
    },
    {
        email: 'sinistro@administradoramutual.com.br',
        password: '1234567890',
        name: 'Sinistro',
        level: 'Master'
    },
    {
        email: 'adm@administradoramutual.com.br',
        password: '1234567890',
        name: 'Administrativo',
        level: 'Master'
    },
    {
        email: 'alpha@administradoramutual.com.br',
        password: '1234567890',
        name: 'Alpha',
        level: 'Master'
    }
];

// Chave para armazenamento no localStorage
const STORAGE_KEY = 'sistemas_auth_session';

/**
 * Classe de gerenciamento de autenticação
 */
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.loadSession();
    }

    /**
     * Carrega sessão do localStorage
     */
    loadSession() {
        try {
            const sessionData = localStorage.getItem(STORAGE_KEY);
            if (sessionData) {
                const session = JSON.parse(sessionData);
                
                // Verifica se a sessão ainda é válida (24 horas)
                const now = new Date().getTime();
                const sessionTime = new Date(session.timestamp).getTime();
                const hoursDiff = (now - sessionTime) / (1000 * 60 * 60);
                
                if (hoursDiff < 24) {
                    this.currentUser = session.user;
                    return true;
                } else {
                    // Sessão expirada
                    this.logout();
                    return false;
                }
            }
            return false;
        } catch (error) {
            console.error('Erro ao carregar sessão:', error);
            return false;
        }
    }

    /**
     * Salva sessão no localStorage
     */
    saveSession(user) {
        try {
            const session = {
                user: user,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
            this.currentUser = user;
            return true;
        } catch (error) {
            console.error('Erro ao salvar sessão:', error);
            return false;
        }
    }

    /**
     * Realiza login
     * @param {string} email - Email do usuário
     * @param {string} password - Senha do usuário
     * @returns {Object} Resultado do login
     */
    login(email, password) {
        // Busca usuário
        const user = MASTER_USERS.find(u => 
            u.email.toLowerCase() === email.toLowerCase() && 
            u.password === password
        );

        if (user) {
            // Remove senha antes de salvar
            const userToSave = {
                email: user.email,
                name: user.name,
                level: user.level
            };
            
            this.saveSession(userToSave);
            
            return {
                success: true,
                user: userToSave,
                message: 'Login realizado com sucesso!'
            };
        } else {
            return {
                success: false,
                message: 'Email ou senha incorretos.'
            };
        }
    }

    /**
     * Realiza logout
     */
    logout() {
        localStorage.removeItem(STORAGE_KEY);
        this.currentUser = null;
    }

    /**
     * Verifica se está autenticado
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * Obtém usuário atual
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Protege página - redireciona para login se não autenticado
     */
    protectPage() {
        if (!this.isAuthenticated()) {
            // Salva URL atual para redirecionar após login
            sessionStorage.setItem('redirect_after_login', window.location.href);
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    /**
     * Redireciona após login bem-sucedido
     */
    redirectAfterLogin() {
        const redirectUrl = sessionStorage.getItem('redirect_after_login');
        sessionStorage.removeItem('redirect_after_login');
        
        if (redirectUrl && redirectUrl.includes(window.location.hostname)) {
            window.location.href = redirectUrl;
        } else {
            window.location.href = 'index.html';
        }
    }
}

// Instância global do gerenciador de autenticação
const authManager = new AuthManager();

// Expõe para uso global
window.authManager = authManager;
