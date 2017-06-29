var cx = require('classnames');
var React = require('react');
var ReactDOM = require('react-dom');
var lang = require('lodash/lang');

var Node = React.createClass({
  displayName: 'UITreeNode',

  getInitialState() {
    return {
      index: lang.clone(this.props.index),
    }
  },

  componentWillReceiveProps(nextProps) {
    this.setState({
      index: lang.clone(nextProps.index),
    })
  },

  shouldComponentUpdate(nextProps, nextState) {
    var draggingParents = nextProps.tree.getParents(nextProps.dragging);

    if(nextProps.dragging && nextProps.index.children
        && lang.isEqual(nextProps.index.children, this.state.children)
        && !nextProps.index.children.includes(nextProps.dragging)
        && !draggingParents.includes(nextProps.index.id)){
      return false;
    }
    return true;
  },

  renderCollapse() {
    const { index } = this.state;

    if(index.children && index.children.length) {
      var collapsed = index.node.collapsed;

      return (
        <span
          className={cx('collapse', collapsed ? 'caret-right' : 'caret-down')}
          onMouseDown={function(e) {e.stopPropagation()}}
          onClick={this.handleCollapse}>
        </span>
      );
    }

    return null;
  },

  renderChildren() {
    const { tree, dragging } = this.props;
    const { index } = this.state;

    if(index.children && index.children.length) {
      var childrenStyles = {};
      if(index.node.collapsed) childrenStyles.display = 'none';
      childrenStyles['paddingLeft'] = this.props.paddingLeft + 'px';

      return (
        <div className="children" style={childrenStyles}>
          {index.children.map((child) => {
            var childIndex = tree.getIndex(child);
            return (
              <Node
                tree={tree}
                index={childIndex}
                key={childIndex.id}
                dragging={dragging}
                paddingLeft={this.props.paddingLeft}
                onCollapse={this.props.onCollapse}
                onDragStart={this.props.onDragStart}
              />
            );
          })}
        </div>
      );
    }

    return null;
  },

  render() {
    const { tree, dragging } = this.props;
    const { index } = this.state;
    var node = index.node;
    var styles = {};

    return (
      <div className={cx('m-node', {
        'placeholder': index.id === dragging
      })} style={styles}>
        <div className="inner" ref="inner" onMouseDown={this.handleMouseDown}>
          {this.renderCollapse()}
          {tree.renderNode(node)}
        </div>
        {this.renderChildren()}
      </div>
    );
  },

  handleCollapse(e) {
    e.stopPropagation();
    const { index } = this.state;
    var nodeId = index.id;
    if(this.props.onCollapse) this.props.onCollapse(nodeId);
  },

  handleMouseDown(e) {
    const { index } = this.state;
    var nodeId = index.id;
    var dom = this.refs.inner;

    if(this.props.onDragStart) {
      this.props.onDragStart(nodeId, dom, e);
    }
  }
});

module.exports = Node;
