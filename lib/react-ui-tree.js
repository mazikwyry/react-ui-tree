var React = require('react');
var Tree = require('./tree');
var Node = require('./node');
var lang = require('lodash/lang');

module.exports = React.createClass({
  displayName: 'UITree',

  propTypes: {
    tree: React.PropTypes.object.isRequired,
    paddingLeft: React.PropTypes.number,
    renderNode: React.PropTypes.func.isRequired
  },

  getDefaultProps() {
    return {
      paddingLeft: 20
    };
  },

  getInitialState() {
    return this.init(this.props);
  },

  componentWillReceiveProps(nextProps) {
    if(!this._updated) this.setState(this.init(nextProps));
    else this._updated = false;
  },

  init(props) {
    var tree = new Tree(props.tree);
    tree.isNodeCollapsed = props.isNodeCollapsed;
    tree.renderNode = props.renderNode;
    tree.changeNodeCollapsed = props.changeNodeCollapsed;
    tree.updateNodesPosition();

    return {
      tree: tree,
      dragging: {
        id: null,
        x: null,
        y: null,
        w: null,
        h: null
      }
    };
  },

  getDraggingDom() {
    const { tree, dragging } = this.state;

    if(dragging && dragging.id) {
      var draggingIndex = tree.getIndex(dragging.id);
      var draggingStyles = {
        top: dragging.y,
        left: dragging.x,
        width: dragging.w
      };

      return (
        <div className="m-draggable" style={draggingStyles}>
          <Node
            tree={tree}
            index={draggingIndex}
            paddingLeft={this.props.paddingLeft}
          />
        </div>
      );
    }

    return null;
  },

  render() {
    const { tree, dragging } = this.state;
    var draggingDom = this.getDraggingDom();

    return (
      <div className="m-tree">
        {draggingDom}
        <Node
          tree={tree}
          index={tree.getRoot()}
          key={1}
          paddingLeft={this.props.paddingLeft}
          onDragStart={this.dragStart}
          onCollapse={this.toggleCollapse}
          dragging={dragging && dragging.id}
        />
      </div>
    );
  },

  dragStart(id, dom, e) {
    this.dragging = {
      id: id,
      w: dom.offsetWidth,
      h: dom.offsetHeight,
      x: dom.offsetLeft,
      y: dom.offsetTop
    };

    this._startX = dom.offsetLeft;
    this._startY = dom.offsetTop;
    this._offsetX = e.clientX;
    this._offsetY = e.clientY;
    this._start = true;

    window.addEventListener('mousemove', this.drag);
    window.addEventListener('mouseup', this.dragEnd);
  },

  // oh
  drag(e) {
    if(this._start) {
      this.setState({
        dragging: this.dragging
      });
      this._start = false;
    }

    const { dragging, tree } = this.state;

    var paddingLeft = this.props.paddingLeft;
    var newIndex = null;
    var index = tree.getIndex(dragging.id);
    var collapsed = index.node.collapsed;

    var _startX = this._startX;
    var _startY = this._startY;
    var _offsetX = this._offsetX;
    var _offsetY = this._offsetY;

    var pos = {
      x: _startX + e.clientX - _offsetX,
      y: _startY + e.clientY - _offsetY
    };
    dragging.x = pos.x;
    dragging.y = pos.y;

    var diffX = dragging.x - paddingLeft/2 - (index.left-2) * paddingLeft;
    var diffY = dragging.y - dragging.h/2 - (index.top-2) * dragging.h;

    if(diffX < 0) { // left
      if(index.parent && !index.next) {
        newIndex = tree.move(index.id, index.parent, 'after');
        dragging.toId = index.parent;
        dragging.placement = 'after';
      }
    } else if(diffX > paddingLeft) { // right
      if(index.prev) {
        var prevNode = tree.getIndex(index.prev).node;
        if(!prevNode.collapsed && !prevNode.leaf) {
          newIndex = tree.move(index.id, index.prev, 'append');
          dragging.toId = index.prev;
          dragging.placement = 'append';
        }
      }
    }

    if(newIndex) {
      index = newIndex;
      newIndex.node.collapsed = collapsed;
      dragging.id = newIndex.id;
    }

    if(diffY < 0) { // up
      var above = tree.getNodeByTop(index.top-1);
      newIndex = tree.move(index.id, above.id, 'before');
      dragging.toId = above.id;
      dragging.placement = 'before';
    } else if(diffY > dragging.h) { // down
      if(index.next) {
        var below = tree.getIndex(index.next);
        if(below.children && below.children.length && !below.node.collapsed) {
          var firstChildId = below.children[0]
          newIndex = tree.move(index.id, firstChildId, 'before');
          dragging.toId = firstChildId;
          dragging.placement = 'before';
        } else {
          newIndex = tree.move(index.id, index.next, 'after');
          dragging.toId = index.next;
          dragging.placement = 'after';
        }
      } else {
        var below = tree.getNodeByTop(index.top+index.height);
        if(below && below.parent !== index.id) {
          if(below.children && below.children.length) {
            var firstChildId = below.children[0];
            newIndex = tree.move(index.id, firstChildId, 'before');
            dragging.toId = firstChildId;
            dragging.placement = 'before';
          } else {
            newIndex = tree.move(index.id, below.id, 'after');
            dragging.toId = below.id;
            dragging.placement = 'after';
          }
        }
      }
    }

    if(newIndex) {
      newIndex.node.collapsed = collapsed;
      dragging.id = newIndex.id;
    }

    this.setState({
      tree: tree,
      dragging: dragging
    });
  },

  dragEnd() {
    const { tree, dragging } = this.state;
    this.setState({
      dragging: {
        id: null,
        x: null,
        y: null,
        w: null,
        h: null,
        toId: null,
        placement: null,
      }
    });

    this.change(tree, dragging.id, dragging.toId, dragging.placement);
    window.removeEventListener('mousemove', this.drag);
    window.removeEventListener('mouseup', this.dragEnd);
  },

  change(tree, elementMoved = null, elementReferenced = null, placementType = null) {
    this._updated = true;
    if (!elementMoved || !elementReferenced) return false;
    if (elementMoved == elementReferenced) return false;
    if(this.props.onChange) this.props.onChange(tree.obj, elementMoved, elementReferenced, placementType);
  },

  toggleCollapse(nodeId) {
    const { tree } = this.state;
    var index = tree.getIndex(nodeId);
    var node = index.node;
    node.collapsed = !node.collapsed;
    tree.updateNodesPosition();

    this.setState({
      tree: tree
    });

    this.change(tree);
  }
});
