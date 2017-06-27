'use strict';

var Tree = require('js-tree');
var proto = Tree.prototype;

proto.build = function (obj) {
  var indexes = this.indexes;
  var self = this;

  var topLevel = { id: obj.tree_item_id, node: obj };
  indexes[obj.tree_item_id + ''] = topLevel;

  if (obj.children && obj.children.length) walk(obj.children, topLevel);

  function walk(objs, parent) {
    var children = [];
    objs.forEach(function (obj, i) {
      var index = {};
      index.id = obj.tree_item_id;
      index.node = obj;

      if (parent) index.parent = parent.id;

      indexes[index.id + ''] = index;
      children.push(index.id);

      if (obj.children && obj.children.length) walk(obj.children, index);
    });
    parent.children = children;

    children.forEach(function (id, i) {
      var index = indexes[id + ''];
      if (i > 0) index.prev = children[i - 1];
      if (i < children.length - 1) index.next = children[i + 1];
    });
  }

  return topLevel;
};

proto.updateNodesPosition = function () {
  var top = 1;
  var left = 1;
  var root = this.getIndex(this.obj.tree_item_id);
  var self = this;

  root.top = top++;
  root.left = left++;

  if (root.children && root.children.length) {
    walk(root.children, root, left, root.node.collapsed);
  }

  function walk(children, parent, left, collapsed) {
    var height = 1;
    children.forEach(function (id) {
      var node = self.getIndex(id);
      if (collapsed) {
        node.top = null;
        node.left = null;
      } else {
        node.top = top++;
        node.left = left;
      }

      if (node.children && node.children.length) {
        height += walk(node.children, node, left + 1, collapsed || node.node.collapsed);
      } else {
        node.height = 1;
        height += 1;
      }
    });

    if (parent.node.collapsed) parent.height = 1;else parent.height = height;
    return parent.height;
  }
};

proto.move = function (fromId, toId, placement) {
  if (fromId === toId || toId === this.obj.tree_item_id) return;

  var obj = this.remove(fromId);
  var index = null;

  if (placement === 'before') index = this.insertBefore(obj, toId);else if (placement === 'after') index = this.insertAfter(obj, toId);else if (placement === 'prepend') index = this.prepend(obj, toId);else if (placement === 'append') index = this.append(obj, toId);

  // todo: perf
  this.updateNodesPosition();
  return index;
};

proto.getNodeByTop = function (top) {
  var indexes = this.indexes;
  for (var id in indexes) {
    if (indexes.hasOwnProperty(id)) {
      if (indexes[id].top === top) return indexes[id];
    }
  }
};

proto.getRoot = function () {
  return this.getIndex(this.obj.tree_item_id);
};

module.exports = Tree;