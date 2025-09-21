  // Smooth scrolling for navigation
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Header background on scroll
        let lastScrollTop = 0;
        window.addEventListener('scroll', () => {
            const header = document.querySelector('.header');
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > 100) {
                header.style.background = 'rgba(10, 10, 10, 0.95)';
                header.style.transform = scrollTop > lastScrollTop ? 'translateY(-100%)' : 'translateY(0)';
            } else {
                header.style.background = 'rgba(10, 10, 10, 0.9)';
                header.style.transform = 'translateY(0)';
            }
            
            lastScrollTop = scrollTop;
        });

        // Terminal typing effect
        const terminalLines = document.querySelectorAll('.terminal-line');
        let delay = 0;

        terminalLines.forEach((line, index) => {
            line.style.opacity = '0';
            setTimeout(() => {
                line.style.opacity = '1';
                line.style.animation = 'fadeInUp 0.5s ease forwards';
            }, delay);
            delay += 800;
        });

         class ModalManager {
            constructor() {
                this.initializeElements();
                this.attachEventListeners();
                this.initializeValidation();
            }

            initializeElements() {
                // Login elements
                this.loginBtn = document.getElementById('loginBtn');
                this.loginModalOverlay = document.getElementById('loginModalOverlay');
                this.loginModal = document.getElementById('loginModal');
                this.loginCloseBtn = document.getElementById('loginCloseBtn');
                this.loginForm = document.getElementById('loginForm');
                this.loginSubmitBtn = document.getElementById('loginSubmitBtn');
                this.switchToSignup = document.getElementById('switchToSignup');

                // Signup elements
                this.signupBtn = document.getElementById('signupBtn');
                this.signupModalOverlay = document.getElementById('signupModalOverlay');
                this.signupModal = document.getElementById('signupModal');
                this.signupCloseBtn = document.getElementById('signupCloseBtn');
                this.signupForm = document.getElementById('signupForm');
                this.signupSubmitBtn = document.getElementById('signupSubmitBtn');
                this.switchToLogin = document.getElementById('switchToLogin');
            }

            attachEventListeners() {
                // Open modals
                this.loginBtn.addEventListener('click', () => this.openLoginModal());
                this.signupBtn.addEventListener('click', () => this.openSignupModal());

                // Close modals
                this.loginCloseBtn.addEventListener('click', () => this.closeLoginModal());
                this.signupCloseBtn.addEventListener('click', () => this.closeSignupModal());

                // Switch between modals
                this.switchToSignup.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.closeLoginModal();
                    setTimeout(() => this.openSignupModal(), 150);
                });

                this.switchToLogin.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.closeSignupModal();
                    setTimeout(() => this.openLoginModal(), 150);
                });

                // Close on overlay click
                this.loginModalOverlay.addEventListener('click', (e) => {
                    if (e.target === this.loginModalOverlay) this.closeLoginModal();
                });

                this.signupModalOverlay.addEventListener('click', (e) => {
                    if (e.target === this.signupModalOverlay) this.closeSignupModal();
                });

                // Prevent modal content clicks from closing
                this.loginModal.addEventListener('click', (e) => e.stopPropagation());
                this.signupModal.addEventListener('click', (e) => e.stopPropagation());

                // Keyboard events
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        this.closeLoginModal();
                        this.closeSignupModal();
                    }
                });

               
               
            }

            initializeValidation() {
                // Real-time validation for all inputs
                const inputs = document.querySelectorAll('.form-input');
                inputs.forEach(input => {
                    input.addEventListener('blur', () => this.validateField(input));
                    input.addEventListener('input', () => this.clearFieldError(input));
                });
            }

            openLoginModal() {
                this.loginModalOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
                // Focus first input
                setTimeout(() => document.getElementById('loginEmail').focus(), 300);
            }

            closeLoginModal() {
                this.loginModalOverlay.classList.remove('active');
                document.body.style.overflow = 'auto';
                this.resetForm(this.loginForm);
            }

            openSignupModal() {
                this.signupModalOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
                // Focus first input
                setTimeout(() => document.getElementById('signupName').focus(), 300);
            }

            closeSignupModal() {
                this.signupModalOverlay.classList.remove('active');
                document.body.style.overflow = 'auto';
                this.resetForm(this.signupForm);
            }

            resetForm(form) {
                setTimeout(() => {
                    form.reset();
                    // Clear all errors
                    form.querySelectorAll('.form-input').forEach(input => {
                        input.classList.remove('error');
                    });
                    form.querySelectorAll('.error-message').forEach(error => {
                        error.style.display = 'none';
                    });
                    // Reset submit buttons
                    form.querySelector('.submit-btn').classList.remove('loading');
                    form.querySelector('.submit-btn').disabled = false;
                }, 300);
            }

            validateField(input) {
                const value = input.value.trim();
                const fieldName = input.id;
                let isValid = true;
                let errorMessage = '';

                switch (fieldName) {
                    
                    case 'signupEmail':
                        if (!value) {
                            errorMessage = 'Email is required';
                            isValid = false;
                        } else if (!this.isValidEmail(value)) {
                            errorMessage = 'Please enter a valid email address';
                            isValid = false;
                        }
                        break;

                    case 'signupName':
                        if (!value) {
                            errorMessage = 'Name is required';
                            isValid = false;
                        } else if (value.length < 2) {
                            errorMessage = 'Name must be at least 2 characters';
                            isValid = false;
                        }
                        break;

                    case 'loginPassword':
                    case 'signupPassword':
                        if (!value) {
                            errorMessage = 'Password is required';
                            isValid = false;
                        } else if (fieldName === 'signupPassword' && value.length < 6) {
                            errorMessage = 'Password must be at least 6 characters';
                            isValid = false;
                        }
                        break;

                    case 'signupConfirmPassword':
                        const password = document.getElementById('signupPassword').value;
                        if (!value) {
                            errorMessage = 'Please confirm your password';
                            isValid = false;
                        } else if (value !== password) {
                            errorMessage = 'Passwords do not match';
                            isValid = false;
                        }
                        break;
                }

                this.showFieldError(input, errorMessage, !isValid);
                return isValid;
            }

            showFieldError(input, message, hasError) {
                const errorElement = document.getElementById(input.id + 'Error');
                if (hasError) {
                    input.classList.add('error');
                    errorElement.textContent = message;
                    errorElement.style.display = 'block';
                } else {
                    input.classList.remove('error');
                    errorElement.style.display = 'none';
                }
            }

            clearFieldError(input) {
                input.classList.remove('error');
                const errorElement = document.getElementById(input.id + 'Error');
                if (errorElement) {
                    errorElement.style.display = 'none';
                }
            }

            isValidEmail(email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(email);
            }
        }

        // Initialize the modal manager when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            new ModalManager();
        });

        // Add smooth focus transitions
        document.addEventListener('DOMContentLoaded', () => {
            const inputs = document.querySelectorAll('.form-input');
            inputs.forEach(input => {
                input.addEventListener('focus', (e) => {
                    e.target.parentElement.style.transform = 'translateY(-2px)';
                });
                
                input.addEventListener('blur', (e) => {
                    e.target.parentElement.style.transform = 'translateY(0)';
                });
            });
        });