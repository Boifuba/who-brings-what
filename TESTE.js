if (!canvas.tokens.controlled.length) {
  return ui.notifications.warn("Selecione um token primeiro.");
}

const token = canvas.tokens.controlled[0];

// Remove highlight anterior
if (token.myHighlight) {
  // Remover hook de rotação se existir
  if (token.myHighlight._rotationHookId) {
    Hooks.off('updateToken', token.myHighlight._rotationHookId);
  }
  
  token.removeChild(token.myHighlight);
  token.myHighlight.destroy();
  token.myHighlight = null;
}

// Detectar tipo de grid hexagonal
const gridType = canvas.grid.type;
const isHexGrid = gridType === CONST.GRID_TYPES.HEXODDR || gridType === CONST.GRID_TYPES.HEXEVENR || 
                  gridType === CONST.GRID_TYPES.HEXODDQ || gridType === CONST.GRID_TYPES.HEXEVENQ;

if (!isHexGrid) {
  return ui.notifications.warn("Este macro funciona apenas com grids hexagonais!");
}

// Determinar orientação do hexágono
const isPointyTop = gridType === CONST.GRID_TYPES.HEXODDR || gridType === CONST.GRID_TYPES.HEXEVENR;
const isFlatTop = gridType === CONST.GRID_TYPES.HEXODDQ || gridType === CONST.GRID_TYPES.HEXEVENQ;

const size = canvas.grid.size;
let hexRadius;


hexRadius = size / 2;


// Função auxiliar para converter coordenadas axiais para pixel
function axialToPixel(q, r, currentHexRadius, isPointyTop) {
  let x, y;
  
  if (isPointyTop) {
    // Pointy-top: ponta para cima
    const horizontalSpacing = currentHexRadius * Math.sqrt(3);
    const verticalSpacing = currentHexRadius * 3/2;
    x = horizontalSpacing * (q + r/2);
    y = verticalSpacing * r;
  } else {
    // Flat-top: lado para cima
    const horizontalSpacing = currentHexRadius * 3/2;
    const verticalSpacing = currentHexRadius * Math.sqrt(3);
    x = horizontalSpacing * q;
    y = verticalSpacing * (r + q/2);
  }
  
  return { x, y };
}

// Definir grid de hexágonos com 5 anéis ao redor do centro
const hexGrid = {};
const gridSize = 5;

// Gerar posições dos hexágonos em coordenadas axiais
for (let q = -gridSize; q <= gridSize; q++) {
  for (let r = -gridSize; r <= gridSize; r++) {
    if (Math.abs(q + r) <= gridSize) {
      const key = `${q},${r}`;
      hexGrid[key] = {
        q, 
        r,
        selected: q === 0 && r === 0, // Centro sempre selecionado
        isCenter: q === 0 && r === 0
      };
    }
  }
}

function drawHex(g, cx, cy, radius, isPointyTop) {
  // Desenhar hexágono baseado na orientação
  if (isPointyTop) {
    // Pointy-top: começar do topo
    g.moveTo(cx, cy - radius);
    for (let i = 1; i <= 6; i++) {
      const angle = (i * Math.PI / 3) - (Math.PI / 2);
      g.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
    }
  } else {
    // Flat-top: começar da direita
    g.moveTo(cx + radius, cy);
    for (let i = 1; i <= 6; i++) {
      const angle = i * Math.PI / 3;
      g.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
    }
  }
}

// Criar SVG da colmeia para o diálogo
function createHoneycombSVG(isPointyTop) {
  const svgSize = 400;
  const svgRadius = 18;
  
  let svgContent = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" style="border: 1px solid #ccc; background: #fafafa; border-radius: 4px;">`;
  
  Object.entries(hexGrid).forEach(([key, hex]) => {
    // Converter coordenadas axiais para pixel no contexto do SVG
    const svgPixelCoords = axialToPixel(hex.q, hex.r, svgRadius, isPointyTop);
    const svgX = svgSize/2 + svgPixelCoords.x;
    const svgY = svgSize/2 + svgPixelCoords.y;
    
    // Criar pontos do hexágono baseado na orientação
    let points = [];
    if (isPointyTop) {
      // Pointy-top: começar do topo
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI / 3) - (Math.PI / 2);
        const px = svgX + svgRadius * Math.cos(angle);
        const py = svgY + svgRadius * Math.sin(angle);
        points.push(`${px.toFixed(2)},${py.toFixed(2)}`);
      }
    } else {
      // Flat-top: começar da direita
      for (let i = 0; i < 6; i++) {
        const angle = i * Math.PI / 3;
        const px = svgX + svgRadius * Math.cos(angle);
        const py = svgY + svgRadius * Math.sin(angle);
        points.push(`${px.toFixed(2)},${py.toFixed(2)}`);
      }
    }
    
    const fillColor = hex.isCenter ? '#4CAF50' : (hex.selected ? '#2196F3' : '#ffffff');
    const strokeColor = hex.isCenter ? '#2E7D32' : '#666666';
    const strokeWidth = hex.isCenter ? '2' : '1';
    
    svgContent += `
      <polygon points="${points.join(' ')}" 
               fill="${fillColor}" 
               stroke="${strokeColor}" 
               stroke-width="${strokeWidth}" 
               style="cursor: pointer;"
               data-hex="${key}"
               onclick="toggleHex('${key}')"/>
    `;
  });
  
  svgContent += '</svg>';
  return svgContent;
}

// Detectar orientação para exibir no diálogo
const orientationText = isPointyTop ? "Ponta para Cima (Pointy-Top)" : "Lado para Cima (Flat-Top)";

// HTML do diálogo
const dialogContent = `
<form>
  <div style="margin-bottom: 15px;">
    <h3 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">Configurador de Colmeia Hexagonal</h3>
    <div style="font-size: 11px; color: #666; margin-bottom: 8px; padding: 6px; background: #e8f5e8; border-radius: 3px; border-left: 2px solid #4CAF50;">
      <strong>Grid:</strong> ${orientationText} | <strong>Tamanho:</strong> ${size}px | <strong>Raio:</strong> ${hexRadius.toFixed(1)}px
    </div>
    <p style="font-size: 11px; color: #666; margin: 0; padding: 6px; background: #f0f8ff; border-radius: 3px; border-left: 2px solid #2196F3;">
      <strong>Verde</strong> = Token (centro) | <strong>Azul</strong> = Selecionados | <strong>Branco</strong> = Disponíveis
    </p>
  </div>
  
  <div style="text-align: center; margin-bottom: 15px;">
    ${createHoneycombSVG(isPointyTop)}
  </div>
  
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
    <div>
      <label style="display: block; font-weight: bold; margin-bottom: 3px; font-size: 12px;">Cor do Contorno:</label>
      <input type="color" name="color" value="#ff0000" style="width: 100%; height: 30px; border: none; border-radius: 3px; cursor: pointer;">
    </div>
    
    <div>
      <label style="display: block; font-weight: bold; margin-bottom: 3px; font-size: 12px;">Espessura:</label>
      <div style="display: flex; align-items: center; gap: 8px;">
        <input type="range" name="thickness" min="1" max="10" value="4" style="flex: 1;">
        <span id="thickness-value" style="min-width: 15px; font-weight: bold; font-size: 12px;">4</span>
      </div>
    </div>
    
    <div>
      <label style="display: block; font-weight: bold; margin-bottom: 3px; font-size: 12px;">Transparência:</label>
      <div style="display: flex; align-items: center; gap: 8px;">
        <input type="range" name="alpha" min="0.1" max="1" step="0.1" value="0.7" style="flex: 1;">
        <span id="alpha-value" style="min-width: 25px; font-weight: bold; font-size: 12px;">0.7</span>
      </div>
    </div>
    
    <div>
      <label style="display: block; font-weight: bold; margin-bottom: 3px; font-size: 12px;">Cor do Preenchimento:</label>
      <input type="color" name="fillColor" value="#ff0000" style="width: 100%; height: 30px; border: none; border-radius: 3px; cursor: pointer;">
    </div>
  </div>
  
  <div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px; border: 1px solid #dee2e6;">
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
      <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 12px;">
        <input type="checkbox" name="enableFill" checked style="transform: scale(1.1);">
        <span style="font-weight: bold;">Preenchimento</span>
      </label>
      
      <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 12px;">
        <input type="checkbox" name="enableContour" checked style="transform: scale(1.1);">
        <span style="font-weight: bold;">Contorno</span>
      </label>
      
      <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 12px;">
        <input type="checkbox" name="rotateWithToken" checked style="transform: scale(1.1);">
        <span style="font-weight: bold;">Girar com token</span>
      </label>
    </div>
  </div>
</form>

<script>
  // Dados dos hexágonos
  window.hexGridData = ${JSON.stringify(hexGrid)};
  
  // Função para alternar seleção de hexágono
  window.toggleHex = function(key) {
    if (window.hexGridData[key].isCenter) return; // Não pode desselecionar o centro
    
    window.hexGridData[key].selected = !window.hexGridData[key].selected;
    
    // Atualizar visual
    const polygon = document.querySelector(\`[data-hex="\${key}"]\`);
    if (polygon) {
      polygon.setAttribute('fill', window.hexGridData[key].selected ? '#2196F3' : '#ffffff');
    }
  };
  
  // Atualizar valores em tempo real
  document.querySelector('[name="thickness"]').oninput = function() {
    document.getElementById('thickness-value').textContent = this.value;
  }
  
  document.querySelector('[name="alpha"]').oninput = function() {
    document.getElementById('alpha-value').textContent = this.value;
  }
</script>
`;

// Criar o diálogo
new Dialog({
  title: "Configurador de Colmeia Hexagonal",
  content: dialogContent,
  buttons: {
    draw: {
      label: "Desenhar",
      callback: (html) => {
        // Coletar hexágonos selecionados
        const selectedHexes = Object.entries(window.hexGridData)
          .filter(([key, hex]) => hex.selected)
          .map(([key, hex]) => hex);
        
        if (selectedHexes.length === 0) {
          return ui.notifications.warn("Selecione pelo menos um hexágono!");
        }
        
        // Coletar configurações
        const colorHex = html.find('[name="color"]').val();
        const color = parseInt(colorHex.replace('#', '0x'));
        const fillColorHex = html.find('[name="fillColor"]').val();
        const fillColor = parseInt(fillColorHex.replace('#', '0x'));
        const thickness = parseInt(html.find('[name="thickness"]').val());
        const alpha = parseFloat(html.find('[name="alpha"]').val());
        const enableFill = html.find('[name="enableFill"]').is(':checked');
        const enableContour = html.find('[name="enableContour"]').is(':checked');
        const rotateWithToken = html.find('[name="rotateWithToken"]').is(':checked');
        
        // Criar gráfico
        const graphics = new PIXI.Graphics();
        
        // Aplicar contorno se habilitado
        if (enableContour) {
          graphics.lineStyle(thickness, color, alpha);
        }
        
        // Desenhar hexágonos selecionados individualmente
        selectedHexes.forEach(hex => {
          // Converter coordenadas axiais para pixel no contexto do Foundry VTT
          const pixelCoords = axialToPixel(hex.q, hex.r, hexRadius, isPointyTop);
          
          // Aplicar preenchimento se habilitado
          if (enableFill) {
            graphics.beginFill(fillColor, alpha);
          }
          
          drawHex(graphics, pixelCoords.x, pixelCoords.y, hexRadius, isPointyTop);
          
          if (enableFill) {
            graphics.endFill();
          }
        });
        
        // Posicionar no centro do token - deve ficar perfeitamente alinhado
        graphics.position.set(size / 2, size / 2);
        
        // Se deve girar com o token, ajustar rotação inicial
        if (rotateWithToken) {
          graphics.rotation = Math.toRadians(token.document.rotation || 0);
          
          // Criar hook para rotação automática
          const hookId = Hooks.on('updateToken', (tokenDoc, changes) => {
            if (tokenDoc.id === token.id && 'rotation' in changes && graphics.parent) {
              graphics.rotation = Math.toRadians(changes.rotation);
            }
          });
          
          // Armazenar o ID do hook para limpeza posterior
          graphics._rotationHookId = hookId;
        }
        
        // Adicionar ao token (embaixo do token)
        token.addChildAt(graphics, 0);
        token.myHighlight = graphics;
        
        ui.notifications.info(`Colmeia desenhada com ${selectedHexes.length} hexágono(s)!`);
      }
    },
    clear: {
      label: "Limpar",
      callback: () => {
        if (token.myHighlight) {
          // Remover hook de rotação se existir
          if (token.myHighlight._rotationHookId) {
            Hooks.off('updateToken', token.myHighlight._rotationHookId);
          }
          
          token.removeChild(token.myHighlight);
          token.myHighlight.destroy();
          token.myHighlight = null;
          ui.notifications.info("Colmeia removida!");
        } else {
          ui.notifications.warn("Nenhuma colmeia para remover!");
        }
      }
    },
    cancel: {
      label: "Cancelar"
    }
  },
  default: "draw",
  close: () => {}
}, {
  width: 500,
  height: 650,
  resizable: true
}).render(true);