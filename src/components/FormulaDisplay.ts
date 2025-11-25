import katex from 'katex';
import { THEME } from '../config.ts';

interface ParamItem {
  symbol: string;
  desc: string;
}

interface FormulaItem {
  label?: string;
  tex: string;
  params?: ParamItem[];
}

export class FormulaDisplay {
  private container: HTMLElement | null;

  constructor(containerId: string) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.warn(`Formula container #${containerId} not found`);
    }
  }

  /**
   * 渲染 LaTeX 公式字符串。
   * @param {string|string[]|FormulaItem[]} latex - 要渲染的 LaTeX 字符串或字符串数组
   * @param {boolean} displayMode - 是否以显示模式渲染（居中块）
   */
  setFormula(latex: string | string[] | FormulaItem[], displayMode: boolean = true): void {
    if (!this.container) return;

    this.clear();

    const formulas = Array.isArray(latex) ? latex : [latex];

    formulas.forEach(item => {
      const wrapper = document.createElement('div');
      wrapper.style.width = '100%';
      wrapper.style.textAlign = 'center';

      let tex = item;

      // 支持 { label: '说明', tex: '公式', params: [{symbol, desc}] } 格式
      if (typeof item === 'object' && item !== null && 'tex' in item) {
        if (item.label) {
          const labelDiv = document.createElement('div');
          labelDiv.textContent = item.label;
          labelDiv.style.fontSize = '0.85rem';
          labelDiv.style.color = THEME.colors.ui.textSub;
          labelDiv.style.marginTop = '0.5rem';
          wrapper.appendChild(labelDiv);
        }
        tex = item.tex;
      }

      const texDiv = document.createElement('div');
      wrapper.appendChild(texDiv);

      try {
        katex.render(tex, texDiv, {
          throwOnError: false,
          displayMode: displayMode,
        });
      } catch (e) {
        console.error('KaTeX render error:', e);
        texDiv.textContent = tex;
      }

      // 渲染参数说明
      if (typeof item === 'object' && item !== null && 'params' in item && Array.isArray(item.params)) {
        const paramsDiv = document.createElement('div');
        paramsDiv.style.display = 'flex';
        paramsDiv.style.flexWrap = 'wrap';
        paramsDiv.style.justifyContent = 'center';
        paramsDiv.style.gap = '0.8rem';
        paramsDiv.style.marginTop = '0.2rem';
        paramsDiv.style.fontSize = '0.75rem';
        paramsDiv.style.color = THEME.colors.ui.textSub;

        item.params.forEach(p => {
          const span = document.createElement('span');
          const symSpan = document.createElement('span');
          try {
            katex.render(p.symbol, symSpan, { throwOnError: false });
          } catch (e) {
            symSpan.textContent = p.symbol;
          }

          const textNode = document.createTextNode(`: ${p.desc}`);
          span.appendChild(symSpan);
          span.appendChild(textNode);
          paramsDiv.appendChild(span);
        });
        wrapper.appendChild(paramsDiv);
      }

      this.container.appendChild(wrapper);
    });
  }

  clear(): void {
    if (this.container) this.container.innerHTML = '';
  }
}
