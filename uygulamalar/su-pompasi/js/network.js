/* Numex Atlas — ağ (graf) veri modeli
   Sorumluluk: düğüm/kenar verisi, kimlik, JSON, silme. Matematik YOK. */
(function (global) {
  'use strict';

  let seq = 0;

  const NODE_LABEL = {
    reservoir: 'Su Deposu / Rezervuar',
    junction: 'Dağıtım Düğümü',
    neighborhood: 'Mahalle / Tüketim Noktası'
  };
  const EDGE_LABEL = { pipe: 'Boru Hattı', pump: 'Pompa', valve: 'Vana' };

  function num(v, d) { const n = Number(v); return isFinite(n) ? n : d; }

  class Network {
    constructor(name) {
      this.name = name || 'Yeni Şebeke';
      this.nodes = [];
      this.edges = [];
    }

    static nextId(prefix) { seq += 1; return prefix + seq; }
    static adoptId(id) {
      const m = /(\d+)$/.exec(String(id || ''));
      if (m) seq = Math.max(seq, parseInt(m[1], 10));
    }

    autoName(type) {
      const pool = { reservoir: 'Depo', junction: 'Düğüm', neighborhood: 'Mahalle' };
      const base = pool[type] || 'Eleman';
      let i = this.nodes.filter(n => n.type === type).length + 1;
      let name = base + ' ' + i;
      const taken = new Set(this.nodes.map(n => n.name));
      while (taken.has(name)) { i += 1; name = base + ' ' + i; }
      return name;
    }

    addNode(props) {
      props = props || {};
      if (props.id) Network.adoptId(props.id);
      const type = props.type || 'junction';
      const node = {
        id: props.id || Network.nextId('N'),
        type: type,
        name: props.name || this.autoName(type),
        x: num(props.x, 220),
        y: num(props.y, 220),
        elevation: num(props.elevation, 0),
        head: num(props.head, 100),
        capacity: num(props.capacity, 5000),
        demand: num(props.demand, 10),
        minPressure: num(props.minPressure, 20)
      };
      this.nodes.push(node);
      return node;
    }

    addEdge(props) {
      props = props || {};
      if (props.id) Network.adoptId(props.id);
      if (!this.getNode(props.from)) throw new Error('Başlangıç düğümü bulunamadı.');
      if (!this.getNode(props.to)) throw new Error('Bitiş düğümü bulunamadı.');
      if (props.from === props.to) throw new Error('Bir düğüm kendisine bağlanamaz.');
      const type = props.type || 'pipe';
      const edge = {
        id: props.id || Network.nextId('E'),
        type: type,
        from: props.from,
        to: props.to,
        length: num(props.length, 400),
        diameter: num(props.diameter, 200),
        coeff: num(props.coeff, 1),
        open: props.open === undefined ? true : !!props.open,
        pumpHead: num(props.pumpHead, 25)
      };
      this.edges.push(edge);
      return edge;
    }

    getNode(id) { return this.nodes.find(n => n.id === id) || null; }
    getEdge(id) { return this.edges.find(e => e.id === id) || null; }
    edgesOf(id) { return this.edges.filter(e => e.from === id || e.to === id); }

    removeNode(id) {
      this.nodes = this.nodes.filter(n => n.id !== id);
      this.edges = this.edges.filter(e => e.from !== id && e.to !== id);
    }
    removeEdge(id) { this.edges = this.edges.filter(e => e.id !== id); }

    edgeTitle(e) {
      const a = this.getNode(e.from), b = this.getNode(e.to);
      return (a ? a.name : '?') + ' → ' + (b ? b.name : '?');
    }
    nodeTitle(n) { return n.name + ' · ' + (NODE_LABEL[n.type] || n.type); }

    toJSON() {
      return {
        app: 'Numex Atlas',
        version: 1,
        name: this.name,
        nodes: this.nodes.map(n => Object.assign({}, n)),
        edges: this.edges.map(e => Object.assign({}, e))
      };
    }

    static fromJSON(obj) {
      if (!obj || !Array.isArray(obj.nodes) || !Array.isArray(obj.edges)) {
        throw new Error('Geçersiz şebeke dosyası.');
      }
      const net = new Network(obj.name || 'Yüklenen Şebeke');
      obj.nodes.forEach(n => net.addNode(Object.assign({}, n)));
      obj.edges.forEach(e => {
        if (net.getNode(e.from) && net.getNode(e.to) && e.from !== e.to) {
          net.addEdge(Object.assign({}, e));
        }
      });
      return net;
    }

    clone() { return Network.fromJSON(JSON.parse(JSON.stringify(this.toJSON()))); }
    stats() { return { nodes: this.nodes.length, edges: this.edges.length }; }
  }

  global.NumexNetwork = { Network: Network, NODE_LABEL: NODE_LABEL, EDGE_LABEL: EDGE_LABEL };
})(window);
