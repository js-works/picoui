// Code is based on this article here - many thanks to Jason Yu:
// https://dev.to/ycmjason/building-a-simple-virtual-dom-from-scratch-3d05

// === exports =======================================================

export { h, render, renderToString };
export type { VElement, VNode };

// === types =========================================================

type Props = Record<
  string,
  string | number | boolean | ((ev: Event) => void) | null | undefined
>;

type Patch = (node: Element | Text) => void;

type VElement = {
  tagName: string;
  props: Props | null;
  children: VNode[];
};

type VNode = string | number | VElement | null | undefined;

// === local constants ===============================================

const symbolVElem = Symbol('velem');
const encodedEntities = /["&<]/g;

const entityReplacements: Record<string, string> = {
  '"': '&quot;',
  '&': '&amp;',
  '<': '&lt;'
};

const svgNamespace = 'http://www.w3.org/2000/svg';

// === exported functions ============================================

function h(
  tagName: string,
  props: Props | null = null,
  ...children: (VNode | VNode[])[]
): VElement {
  return {
    tagName,
    props,
    children: children.flat(100)
  };
}

function renderToString(vnode: VNode): string {
  const tokens: string[] = [];
  const push = tokens.push.bind(tokens);

  const encodeEntities = (s: string) =>
    s.replaceAll(encodedEntities, (ch) => entityReplacements[ch]);

  const process = (vnode: VNode): void => {
    if (vnode == null) {
      return;
    }

    if (typeof vnode === 'string') {
      push(vnode);
    } else if (typeof vnode === 'number') {
      push(String(vnode));
    } else {
      push('<', vnode.tagName);

      let props = vnode.props;

      if (!props?.xmlns) {
        const ns = getNamespace(vnode);

        if (ns) {
          props = { ...vnode.props, xmlns: ns };
        }
      }

      if (props) {
        for (const [k, v] of Object.entries(props)) {
          if (typeof v === 'string' || typeof v === 'number') {
            push(' ', k, '="', encodeEntities(String(v)), '"');
          }
        }
      }

      push('>');
      vnode.children.forEach(process);
      push('</', vnode.tagName, '>');
    }
  };

  process(vnode);

  return tokens.join('');
}

function render(velem: VElement, container: Element) {
  const oldVElem = (container as any)[symbolVElem];

  if (!oldVElem) {
    container.replaceChildren(renderVElement(velem));
  } else {
    diff(oldVElem, velem, '')(container.firstElementChild!);
  }

  (container as any)[symbolVElem] = velem;
}

// === local functions ===============================================

function renderVElement(velem: VElement, ns?: string): Element {
  let elem: Element;

  if (!ns) {
    ns = getNamespace(velem);
  }

  if (!ns) {
    elem = document.createElement(velem.tagName);
  } else {
    elem = document.createElementNS(ns, velem.tagName);
  }

  if (velem.props) {
    for (const [k, v] of Object.entries(velem.props)) {
      if (v != null && v !== false) {
        updateProp(elem, k, v === true ? '' : v, ns);
      }
    }
  }

  for (const vchild of velem.children) {
    elem.append(renderVNode(vchild, ns || ''));
  }

  return elem;
}

function renderVNode(vnode: VNode, ns: string): Element | Text {
  return vnode == null
    ? document.createTextNode('')
    : typeof vnode !== 'object'
    ? document.createTextNode(String(vnode))
    : renderVElement(vnode, ns);
}

function diffProps(oldProps: Props, newProps: Props, ns: string): Patch {
  const patches: Patch[] = [];

  for (const [k, v] of Object.entries(newProps)) {
    if (v !== oldProps[k]) {
      patches.push((node) => {
        if (node instanceof Element) {
          updateProp(node, k, v, ns);
        }
      });
    }
  }

  for (const k in oldProps) {
    if (!(k in newProps)) {
      patches.push((node) => {
        if (node instanceof Element) {
          updateProp(node, k, null, ns);
        }
      });
    }
  }

  return (node) => patches.forEach((patch) => patch(node));
}

function diffChildren(
  oldVChildren: VNode[],
  newVChildren: VNode[],
  ns: string
): Patch {
  const childPatches: Patch[] = [];

  oldVChildren.forEach((oldVChild, i) => {
    if (i < newVChildren.length) {
      childPatches.push(diff(oldVChild, newVChildren[i], ns));
    } else {
      childPatches.push((node) => node.remove());
    }
  });

  const additionalPatches: Patch[] = [];

  for (const additionalVChild of newVChildren.slice(oldVChildren.length)) {
    additionalPatches.push((node) => {
      node.appendChild(renderVNode(additionalVChild, ns));
    });
  }

  return (parent) => {
    const length = Math.min(childPatches.length, parent.childNodes.length);
    const childNodes: Node[] = [];

    for (let i = 0; i < length; ++i) {
      childNodes.push(parent.childNodes[i]);
    }

    for (let i = 0; i < length; ++i) {
      childPatches[i](childNodes[i] as any);
    }

    for (const patch of additionalPatches) {
      patch(parent);
    }
  };
}

function diff(oldVTree: VNode, newVTree: VNode, ns: string): Patch {
  if (!ns) {
    ns = getNamespace(newVTree);
  }

  if (oldVTree == null) {
    return (node) => node.replaceWith(renderVNode(newVTree, ns));
  }

  if (newVTree == null) {
    return (node) => node.replaceWith(document.createTextNode(''));
  }

  if (
    typeof oldVTree === 'string' ||
    typeof oldVTree === 'number' ||
    typeof newVTree === 'string' ||
    typeof newVTree === 'number'
  ) {
    return oldVTree !== newVTree
      ? (node) => node.replaceWith(renderVNode(newVTree, ns))
      : () => {};
  }

  if (oldVTree.tagName !== newVTree.tagName) {
    return (node) => node.replaceWith(renderVElement(newVTree, ns));
  }

  const patchProps = diffProps(oldVTree.props || {}, newVTree.props || {}, ns);
  const patchChildren = diffChildren(oldVTree.children, newVTree.children, ns);

  return (node) => {
    patchProps(node);
    patchChildren(node);
  };
}

// === local helpers =================================================

function updateProp(
  elem: Element,
  propName: string,
  value: Props[string],
  ns: string
) {
  if (propName === 'style') {
    elem.setAttribute('style', typeof value === 'string' ? value : '');
    return;
  }

  if (!(propName in elem) || elem.tagName === 'svg' || ns === svgNamespace) {
    if (value == null) {
      elem.removeAttribute(propName);
    } else {
      elem.setAttribute(propName, String(value));
    }

    return;
  }

  if (propName === 'class') {
    propName = 'className';
  }

  if (value == null || value === false) {
    (elem as unknown as any)[propName] = null;
  } else {
    const val =
      value === true ? '' : typeof value === 'function' ? value : String(value);

    (elem as unknown as any)[propName] = val;
  }
}

function getNamespace(vnode: VNode): string {
  let ret = '';

  if (vnode && typeof vnode === 'object' && vnode.tagName === 'svg') {
    ret = svgNamespace;
  }

  return ret;
}

// cSpell:words vchild vchildren velem vnode
