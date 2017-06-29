'use strict';

var cx = require('classnames');
var React = require('react');
var ReactDOM = require('react-dom');
var lang = require('lodash/lang');

var Node = React.createClass({
  displayName: 'UITreeNode',

  getInitialState: function getInitialState() {
    return {
      index: lang.clone(this.props.index)
    };
  },
  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    this.setState({
      index: lang.clone(nextProps.index)
    });
  },
  shouldComponentUpdate: function shouldComponentUpdate(nextProps, nextState) {
    var draggingParents = nextProps.tree.getParents(nextProps.dragging);

    if (nextProps.dragging && nextProps.index.children && lang.isEqual(nextProps.index.children, this.state.children) && !nextProps.index.children.includes(nextProps.dragging) && !draggingParents.includes(nextProps.index.id)) {
      return false;
    }
    return true;
  },
  renderCollapse: function renderCollapse() {
    var index = this.state.index;


    if (index.children && index.children.length) {
      var collapsed = index.node.collapsed;

      return React.createElement('span', {
        className: cx('collapse', collapsed ? 'caret-right' : 'caret-down'),
        onMouseDown: function onMouseDown(e) {
          e.stopPropagation();
        },
        onClick: this.handleCollapse });
    }

    return null;
  },
  renderChildren: function renderChildren() {
    var _this = this;

    var _props = this.props,
        tree = _props.tree,
        dragging = _props.dragging;
    var index = this.state.index;


    if (index.children && index.children.length) {
      var childrenStyles = {};
      if (index.node.collapsed) childrenStyles.display = 'none';
      childrenStyles['paddingLeft'] = this.props.paddingLeft + 'px';

      return React.createElement(
        'div',
        { className: 'children', style: childrenStyles },
        index.children.map(function (child) {
          var childIndex = tree.getIndex(child);
          return React.createElement(Node, {
            tree: tree,
            index: childIndex,
            key: childIndex.id,
            dragging: dragging,
            paddingLeft: _this.props.paddingLeft,
            onCollapse: _this.props.onCollapse,
            onDragStart: _this.props.onDragStart
          });
        })
      );
    }

    return null;
  },
  render: function render() {
    var _props2 = this.props,
        tree = _props2.tree,
        dragging = _props2.dragging;
    var index = this.state.index;

    var node = index.node;
    var styles = {};

    return React.createElement(
      'div',
      { className: cx('m-node', {
          'placeholder': index.id === dragging
        }), style: styles },
      React.createElement(
        'div',
        { className: 'inner', ref: 'inner', onMouseDown: this.handleMouseDown },
        this.renderCollapse(),
        tree.renderNode(node)
      ),
      this.renderChildren()
    );
  },
  handleCollapse: function handleCollapse(e) {
    e.stopPropagation();
    var index = this.state.index;

    var nodeId = index.id;
    if (this.props.onCollapse) this.props.onCollapse(nodeId);
  },
  handleMouseDown: function handleMouseDown(e) {
    var index = this.state.index;

    var nodeId = index.id;
    var dom = this.refs.inner;

    if (this.props.onDragStart) {
      this.props.onDragStart(nodeId, dom, e);
    }
  }
});

module.exports = Node;