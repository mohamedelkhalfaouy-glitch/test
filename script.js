// Initialize theme - only light theme now
function initTheme() {
    // Ensure light theme is always used
    document.body.classList.remove('dark-mode');
    // Remove any saved dark mode preference
    localStorage.removeItem('darkMode');
}

// Initialize modals
function initModals() {
    console.log('Initializing modals...');
    // Get all modal triggers and modals
    const modalTriggers = document.querySelectorAll('[data-modal], .clickable-card[data-modal]');
    const modals = document.querySelectorAll('.modal, .content-modal');
    const closeButtons = document.querySelectorAll('.close-modal');
    
    // Variable to track the last clicked card in part1-modal
    let lastClickedCard = null;
    
    // Cache for loaded modal content
    const modalCache = {};
    
    console.log('Found modal triggers:', modalTriggers.length);
    console.log('Found modals:', modals.length);
    
    // Mapping of modal IDs to P1 HTML file paths
    const modalFileMap = {
        'choisir-sujet-modal': './Choisir_Definir_Sujet_Recherche.html',
        'construire-problematique-modal': './Construire_Problematique_Recherche.html',
        'formuler-questions-modal': './Formuler_Questions_Recherche.html',
        'definir-objectifs-modal': './Definir_Objectifs_Recherche.html',
        'formuler-hypotheses-modal': './Formuler_Hypotheses_Recherche.html',
        'analyse-documentaire-modal': './Realiser_Analyse_Documentaire.html',
        'gerer-citations-modal': './Gerer_Citations_References_Bibliographiques.html',
        'realiser-benchmarking-modal': './Realiser_Benchmarking.html',
        'revue-litterature-modal': './Realiser_Revue_Litterature.html'
    };
    
    // Function to load modal content from P1 directory
    function loadModalContent(modalId) {
        // Check if this modal should load content from P1 directory
        if (!modalFileMap[modalId]) {
            return Promise.resolve(); // Not a modal that needs dynamic content
        }
        
        // Check if content is already cached
        if (modalCache[modalId]) {
            const modal = document.getElementById(modalId);
            if (modal) {
                const contentGrid = modal.querySelector('.content-grid');
                if (contentGrid) {
                    contentGrid.innerHTML = modalCache[modalId];
                    console.log('Loaded cached content for ' + modalId);
                }
            }
            return Promise.resolve();
        }
        
        console.log('Loading content for ' + modalId + ' from ' + modalFileMap[modalId]);
        
        // Load content from P1 directory file
        return fetch(modalFileMap[modalId])
            .then(response => {
                console.log('Fetch response for ' + modalId + ':', response.status, response.statusText);
                
                // Handle CORS errors specifically
                if (response.status === 0) {
                    // This is likely a CORS error when running from file:// protocol
                    console.warn('CORS error detected for ' + modalId + '. Attempting XMLHttpRequest fallback.');
                    throw new Error('CORS_ERROR');
                }
                
                if (!response.ok) {
                    throw new Error(`Failed to load modal content: ${response.status} ${response.statusText}`);
                }
                return response.text();
            })
            .then(html => {
                console.log('Successfully fetched HTML for ' + modalId + ', length: ' + html.length);
                
                // Parse the HTML content
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                // Check for parsing errors
                const parserError = doc.querySelector('parsererror');
                if (parserError) {
                    console.error('HTML parsing error for ' + modalId + ':', parserError.textContent);
                    throw new Error('HTML parsing failed');
                }
                
                // Find the content-grid within the modal
                const sourceModal = doc.querySelector('.content-modal');
                if (!sourceModal) {
                    console.error('Source modal not found for ' + modalId);
                    throw new Error('Source modal structure not found');
                }
                
                const sourceContentGrid = sourceModal.querySelector('.modal-body .content-grid');
                if (!sourceContentGrid) {
                    console.error('Source content-grid not found for ' + modalId);
                    throw new Error('Source content-grid not found');
                }
                
                // Get the content within the content-grid (the actual content cards)
                const contentCards = sourceContentGrid.innerHTML;
                if (!contentCards) {
                    console.error('No content found within content-grid for ' + modalId);
                    throw new Error('No content found within content-grid');
                }
                
                // Get the target modal and content-grid
                const targetModal = document.getElementById(modalId);
                if (!targetModal) {
                    console.error('Target modal not found for ' + modalId);
                    throw new Error('Target modal not found');
                }
                
                const targetContentGrid = targetModal.querySelector('.content-grid');
                if (!targetContentGrid) {
                    console.error('Target content-grid not found for ' + modalId);
                    throw new Error('Target content-grid not found');
                }
                
                // Copy the content
                targetContentGrid.innerHTML = contentCards;
                
                // Cache the content
                modalCache[modalId] = contentCards;
                
                console.log('Successfully updated content for ' + modalId);
            })
            .catch(error => {
                // Handle CORS errors with XMLHttpRequest fallback
                if (error.message === 'CORS_ERROR') {
                    console.log('Attempting XMLHttpRequest fallback for ' + modalId);
                    return loadContentWithXHR(modalFileMap[modalId], modalId);
                } else {
                    console.error('Error loading modal content for ' + modalId + ':', error);
                    showFallbackContent(modalId, error.message);
                }
            });
    }
    
    // Function to load content using XMLHttpRequest as fallback
    function loadContentWithXHR(url, modalId) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    console.log('XHR response for ' + modalId + ':', xhr.status);
                    if (xhr.status === 200) {
                        console.log('Successfully loaded via XHR for ' + modalId + ', length: ' + xhr.responseText.length);
                        
                        // Parse the HTML content
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(xhr.responseText, 'text/html');
                        
                        // Check for parsing errors
                        const parserError = doc.querySelector('parsererror');
                        if (parserError) {
                            console.error('HTML parsing error for ' + modalId + ':', parserError.textContent);
                            reject(new Error('HTML parsing failed'));
                            return;
                        }
                        
                        // Find the content-grid within the modal
                        const sourceModal = doc.querySelector('.content-modal');
                        if (!sourceModal) {
                            console.error('Source modal not found for ' + modalId);
                            reject(new Error('Source modal structure not found'));
                            return;
                        }
                        
                        const sourceContentGrid = sourceModal.querySelector('.modal-body .content-grid');
                        if (!sourceContentGrid) {
                            console.error('Source content-grid not found for ' + modalId);
                            reject(new Error('Source content-grid not found'));
                            return;
                        }
                        
                        // Get the content within the content-grid (the actual content cards)
                        const contentCards = sourceContentGrid.innerHTML;
                        if (!contentCards) {
                            console.error('No content found within content-grid for ' + modalId);
                            reject(new Error('No content found within content-grid'));
                            return;
                        }
                        
                        // Get the target modal and content-grid
                        const targetModal = document.getElementById(modalId);
                        if (!targetModal) {
                            console.error('Target modal not found for ' + modalId);
                            reject(new Error('Target modal not found'));
                            return;
                        }
                        
                        const targetContentGrid = targetModal.querySelector('.content-grid');
                        if (!targetContentGrid) {
                            console.error('Target content-grid not found for ' + modalId);
                            reject(new Error('Target content-grid not found'));
                            return;
                        }
                        
                        // Copy the content
                        targetContentGrid.innerHTML = contentCards;
                        
                        // Cache the content
                        modalCache[modalId] = contentCards;
                        
                        console.log('Successfully updated content for ' + modalId);
                        resolve();
                    } else if (xhr.status === 0) {
                        // Still a CORS issue
                        console.error('XHR also failed with CORS error for ' + modalId);
                        showFallbackContent(modalId, 'CORS restriction - Unable to load content. Please run this project through a web server.');
                        reject(new Error('CORS restriction'));
                    } else {
                        console.error('XHR failed with status ' + xhr.status + ' for ' + modalId);
                        showFallbackContent(modalId, 'Failed to load content (HTTP ' + xhr.status + ')');
                        reject(new Error('XHR failed with status ' + xhr.status));
                    }
                }
            };
            xhr.onerror = function() {
                console.error('XHR network error for ' + modalId);
                showFallbackContent(modalId, 'Network error - Unable to load content');
                reject(new Error('XHR network error'));
            };
            xhr.send();
        });
    }
    
    // Helper function to show fallback content
    function showFallbackContent(modalId, errorMessage) {
        const modal = document.getElementById(modalId);
        if (modal) {
            const contentGrid = modal.querySelector('.content-grid');
            if (contentGrid) {
                contentGrid.innerHTML = `
                    <div class="content-card">
                        <p>Content could not be loaded. Please try again.</p>
                        <p><strong>Error:</strong> ${errorMessage}</p>
                        <p><strong>Solution:</strong> This issue typically occurs when opening HTML files directly in the browser (file:// protocol). 
                        For best results, please run this project through a web server.</p>
                        <p><strong>Quick fix:</strong> Install a simple HTTP server extension in your code editor, 
                        or use a local development server like Live Server in VS Code.</p>
                    </div>
                `;
            }
        }
    }
    
    // Open modal function
    function openModal(modalId) {
        console.log('Opening modal:', modalId);
        
        // Load content dynamically for modals that should come from P1 directory
        loadModalContent(modalId).then(() => {
            const modal = document.getElementById(modalId);
            if (modal) {
                console.log('Modal element found');
                // Close any open modals first
                document.querySelectorAll('.modal.active, .content-modal.active').forEach(m => {
                    m.classList.remove('active');
                    const content = m.querySelector('.modal-content');
                    if (content) content.classList.remove('show');
                });
                
                // Open the new modal
                document.body.style.overflow = 'hidden';
                modal.classList.add('active');
                
                // Add animation class
                setTimeout(() => {
                    const modalContent = modal.querySelector('.modal-content');
                    if (modalContent) {
                        modalContent.classList.add('show');
                    }
                }, 10);
            } else {
                console.error('Modal not found:', modalId);
            }
        });
    }
    
    // Close modal function
    function closeModal(modal) {
        if (!modal) return;
        
        // Check if we're closing a detailed modal (not part1-modal)
        const isDetailedModal = modal.id !== 'part1-modal' && 
                               modal.id.endsWith('-modal') && 
                               modal.id !== 'revue-litterature-modal' &&
                               modal.id !== 'about-modal';
        
        // Check if we're closing the revue-litterature-modal (special case)
        const isRevueLitteratureModal = modal.id === 'revue-litterature-modal';
        
        // Remove show class for animation
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.remove('show');
        }
        
        // Wait for animation to complete before hiding
        setTimeout(() => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            
            // If we're closing a detailed modal, return to part1-modal
            if (isDetailedModal) {
                setTimeout(() => {
                    openModal('part1-modal');
                    // Focus on the last clicked card if it exists
                    // Special handling for revue-litterature-modal
                    let targetCard = lastClickedCard;
                    if (isRevueLitteratureModal) {
                        // Always find the "Revue de littérature" card in part1-modal when closing revue-litterature-modal
                        targetCard = document.querySelector('.content-card[data-modal="revue-litterature-modal"]');
                    }
                    
                    if (targetCard) {
                        // Scroll to the card and add a temporary highlight
                        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        targetCard.classList.add('highlighted');
                        setTimeout(() => {
                            targetCard.classList.remove('highlighted');
                        }, 2000);
                    }
                }, 10);
            }
        }, 200);
    }
    
    // Add click event to modal triggers
    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const modalId = this.getAttribute('data-modal');
            console.log('Trigger clicked, opening modal:', modalId);
            
            // Add clicked effect
            this.classList.add('active');
            setTimeout(() => {
                this.classList.remove('active');
            }, 200);
            
            // If we're clicking a card in part1-modal, remember it
            if (document.getElementById('part1-modal') && 
                document.getElementById('part1-modal').contains(this)) {
                lastClickedCard = this;
            }
            
            openModal(modalId);
        });
    });
    
    // Add click event to close buttons
    closeButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const modal = this.closest('.modal, .content-modal');
            closeModal(modal);
        });
    });
    
    // Close when clicking outside modal content
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this);
            }
        });
    });
    
    // Close with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal.active, .content-modal.active');
            if (activeModal) {
                e.preventDefault();
                closeModal(activeModal);
            }
        }
    });
    
    console.log('Modals initialized');
}

// Initialize navigation
function initNavigation() {
    console.log('Initializing navigation...');
    
    // Get all navigation links
    const navLinks = document.querySelectorAll('nav a');
    
    // Add click event to navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Get target section
            const targetId = this.getAttribute('href').substring(1);
            showSection(targetId);
        });
    });
    
    // Show initial section based on hash
    const hash = window.location.hash.substring(1);
    if (hash) {
        showSection(hash);
    }
}

// Show section function
function showSection(sectionId) {
    console.log('Showing section:', sectionId);
    
    // Hide all sections
    document.querySelectorAll('section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        targetSection.classList.add('active');
        
        // Update URL hash
        window.location.hash = sectionId;
        
        // Scroll to top of section
        targetSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    
    // Initialize theme (light only)
    initTheme();
    
    // Initialize modals
    initModals();
    
    // Initialize navigation
    initNavigation();
    
    // Show initial section based on hash
    const initialHash = window.location.hash.substring(1);
    if (initialHash) {
        showSection(initialHash);
    }
});

// Get all sections for navigation
const allSections = document.querySelectorAll('section');
