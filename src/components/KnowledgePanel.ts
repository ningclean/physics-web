import katex from 'katex';
import { marked } from 'marked';
import { Scene } from '../core/Scene.ts';

export class KnowledgePanel {
  private container: HTMLElement | null;
  private contentContainer: HTMLElement | null;

  constructor(containerId: string) {
    this.container = document.getElementById(containerId);
    this.contentContainer = document.getElementById('knowledge-content');

    if (!this.container || !this.contentContainer) {
      console.warn(`Knowledge panel container #${containerId} or content area not found`);
    }
  }

  update(scene: Scene): void {
    if (!this.container || !this.contentContainer) return;

    const description = scene.getDescription();

    if (!description) {
      this.contentContainer.innerHTML =
        '<p class="placeholder-text">暂无该场景的详细物理原理解析。</p>';
      return;
    }

    // 解析 Markdown 并设置 HTML 内容
    this.contentContainer.innerHTML = marked.parse(description);

    // 渲染内容中的 LaTeX 公式
    this.renderMath();
  }

  renderMath(): void {
    // 1. 渲染显式的 .math 元素 (块级或行内)
    const mathElements = this.contentContainer!.querySelectorAll('.math');
    mathElements.forEach(el => {
      try {
        const tex = (el as HTMLElement).textContent || (el as HTMLElement).getAttribute('data-tex');
        const displayMode = (el as HTMLElement).tagName.toLowerCase() === 'div' || (el as HTMLElement).classList.contains('display');

        katex.render(tex, el as HTMLElement, {
          throwOnError: false,
          displayMode: displayMode,
        });
      } catch (e) {
        console.error('KaTeX render error in KnowledgePanel:', e);
      }
    });

    // 2. 渲染文本节点中的行内公式 ($...$)
    // 遍历所有文本节点，查找 $...$ 模式
    const walker = document.createTreeWalker(
      this.contentContainer!,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    const nodesToReplace: Text[] = [];

    while ((node = walker.nextNode())) {
      if ((node as Text).nodeValue!.includes('$')) {
        nodesToReplace.push(node as Text);
      }
    }

    nodesToReplace.forEach(textNode => {
      const text = textNode.nodeValue!;
      // 简单的正则匹配 $...$
      // 注意：不支持嵌套或转义的 $，仅用于简单的行内公式
      const parts = text.split(/(\$[^$]+\$)/g);

      if (parts.length > 1) {
        const fragment = document.createDocumentFragment();
        parts.forEach(part => {
          if (part.startsWith('$') && part.endsWith('$')) {
            const tex = part.slice(1, -1);
            const span = document.createElement('span');
            try {
              katex.render(tex, span, {
                throwOnError: false,
                displayMode: false,
              });
            } catch (e) {
              span.textContent = part;
            }
            fragment.appendChild(span);
          } else {
            fragment.appendChild(document.createTextNode(part));
          }
        });
        textNode.parentNode!.replaceChild(fragment, textNode);
      }
    });
  }
}
