/**
 * Mermaid Diagram Zoom & Modal Extension
 * Habilita clique para zoom e movimentação (pan) em diagramas Mermaid no MkDocs Material.
 */

// Se inscreve no ciclo de vida do MkDocs Material para garantir compatibilidade com Instant Loading
document$.subscribe(function() {
  initMermaidZoom();
});

function initMermaidZoom() {
  // 1. Cria o modal HTML na página se ele já não existir
  let modal = document.getElementById('mermaid-zoom-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'mermaid-zoom-modal';
    modal.className = 'mermaid-zoom-modal';
    modal.innerHTML = `
      <button class="mermaid-zoom-close" id="mermaid-zoom-close" aria-label="Fechar modal" title="Fechar (Esc)">&times;</button>
      <div class="mermaid-zoom-content" id="mermaid-zoom-content"></div>
      <div class="mermaid-zoom-controls">
        <button class="mermaid-zoom-btn" id="mermaid-zoom-out" title="Afastar (-)">
          <svg viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>
        </button>
        <button class="mermaid-zoom-btn" id="mermaid-zoom-reset" title="Resetar visualização">
          <svg viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>
        </button>
        <button class="mermaid-zoom-btn" id="mermaid-zoom-in" title="Aproximar (+)">
          <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        </button>
      </div>
    `;
    document.body.appendChild(modal);

    // Eventos para fechar o modal
    const closeBtn = document.getElementById('mermaid-zoom-close');
    closeBtn.addEventListener('click', closeMermaidZoom);

    // Fecha ao clicar fora do conteúdo (no fundo desfocado)
    modal.addEventListener('click', function(e) {
      if (e.target === modal || e.target === document.getElementById('mermaid-zoom-content')) {
        closeMermaidZoom();
      }
    });

    // Tecla ESC para fechar o modal
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeMermaidZoom();
      }
    });
  }

  let panzoomInstance = null;

  function closeMermaidZoom() {
    const modalElement = document.getElementById('mermaid-zoom-modal');
    if (modalElement && modalElement.classList.contains('active')) {
      modalElement.classList.remove('active');
      
      // Destrói a instância de panzoom e limpa referências
      if (panzoomInstance) {
        panzoomInstance.destroy();
        panzoomInstance = null;
      }
      
      // Remove o SVG clonado após a animação de fade-out acabar
      setTimeout(() => {
        document.getElementById('mermaid-zoom-content').innerHTML = '';
      }, 250);
    }
  }

  function openMermaidZoom(svgElement) {
    const modalElement = document.getElementById('mermaid-zoom-modal');
    const content = document.getElementById('mermaid-zoom-content');
    
    content.innerHTML = '';

    // Clona o SVG original do Mermaid
    const clonedSvg = svgElement.cloneNode(true);
    
    // Remove restrições de tamanho inline do Mermaid para permitir zoom sem distorção e com nitidez total
    clonedSvg.removeAttribute('style');
    clonedSvg.removeAttribute('width');
    clonedSvg.removeAttribute('height');
    clonedSvg.style.width = '100%';
    clonedSvg.style.height = '100%';
    clonedSvg.style.maxWidth = 'none';
    clonedSvg.style.maxHeight = 'none';
    
    content.appendChild(clonedSvg);
    modalElement.classList.add('active');

    // Inicializa o Panzoom do `@panzoom/panzoom`
    if (window.Panzoom) {
      panzoomInstance = window.Panzoom(clonedSvg, {
        maxScale: 8,
        minScale: 0.3,
        contain: 'outside',
        canvas: true
      });

      // Suporte a zoom pela roda do mouse (scroll)
      content.addEventListener('wheel', function(e) {
        e.preventDefault();
        panzoomInstance.zoomWithWheel(e);
      }, { passive: false });

      // Configura os botões de controle flutuantes
      document.getElementById('mermaid-zoom-in').onclick = () => panzoomInstance.zoomIn();
      document.getElementById('mermaid-zoom-out').onclick = () => panzoomInstance.zoomOut();
      document.getElementById('mermaid-zoom-reset').onclick = () => panzoomInstance.reset();
    } else {
      console.warn("Biblioteca Panzoom não encontrada globalmente.");
    }
  }

  // Configura um elemento .mermaid individual
  const configureMermaid = (element) => {
    if (element.dataset.zoomConfigured) return;

    // Procura o SVG gerado pelo compilador do Mermaid
    const svg = element.querySelector('svg');
    if (svg) {
      element.dataset.zoomConfigured = 'true';
      element.classList.add('mermaid-clickable');
      element.setAttribute('title', 'Clique para ampliar o diagrama');

      element.addEventListener('click', function(e) {
        // Ignora cliques em links reais se houver links interativos no diagrama
        if (e.target.tagName === 'a' || e.target.closest('a')) return;
        openMermaidZoom(svg);
      });
    }
  };

  // Observe o DOM para quando novos blocos Mermaid forem renderizados (essencial para renderização assíncrona)
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        const mermaids = document.querySelectorAll('.mermaid');
        mermaids.forEach(configureMermaid);
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Configura os diagramas que já estão carregados na página
  document.querySelectorAll('.mermaid').forEach(configureMermaid);
}
