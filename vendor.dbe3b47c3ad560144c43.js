webpackJsonp([0,2],{

/***/ 0:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__("zReY");


/***/ }),

/***/ "zReY":
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*!
 * react-lite.js v0.15.31
 * (c) 2017 Jade Gu
 * Released under the MIT License.
 */


var HTML_KEY = 'dangerouslySetInnerHTML';
var SVGNamespaceURI = 'http://www.w3.org/2000/svg';
var COMPONENT_ID = 'liteid';
var VELEMENT = 2;
var VSTATELESS = 3;
var VCOMPONENT = 4;
var VCOMMENT = 5;
var ELEMENT_NODE_TYPE = 1;
var DOC_NODE_TYPE = 9;
var DOCUMENT_FRAGMENT_NODE_TYPE = 11;

/**
 * current stateful component's refs property
 * will attach to every vnode created by calling component.render method
 */
var refs = null;

function createVnode(vtype, type, props, key, ref) {
    var vnode = {
        vtype: vtype,
        type: type,
        props: props,
        refs: refs,
        key: key,
        ref: ref
    };
    if (vtype === VSTATELESS || vtype === VCOMPONENT) {
        vnode.uid = getUid();
    }
    return vnode;
}

function initVnode(vnode, parentContext, namespaceURI) {
    var vtype = vnode.vtype;

    var node = null;
    if (!vtype) {
        // init text
        node = document.createTextNode(vnode);
    } else if (vtype === VELEMENT) {
        // init element
        node = initVelem(vnode, parentContext, namespaceURI);
    } else if (vtype === VCOMPONENT) {
        // init stateful component
        node = initVcomponent(vnode, parentContext, namespaceURI);
    } else if (vtype === VSTATELESS) {
        // init stateless component
        node = initVstateless(vnode, parentContext, namespaceURI);
    } else if (vtype === VCOMMENT) {
        // init comment
        node = document.createComment('react-text: ' + (vnode.uid || getUid()));
    }
    return node;
}

function updateVnode(vnode, newVnode, node, parentContext) {
    var vtype = vnode.vtype;

    if (vtype === VCOMPONENT) {
        return updateVcomponent(vnode, newVnode, node, parentContext);
    }

    if (vtype === VSTATELESS) {
        return updateVstateless(vnode, newVnode, node, parentContext);
    }

    // ignore VCOMMENT and other vtypes
    if (vtype !== VELEMENT) {
        return node;
    }

    var oldHtml = vnode.props[HTML_KEY] && vnode.props[HTML_KEY].__html;
    if (oldHtml != null) {
        updateVelem(vnode, newVnode, node, parentContext);
        initVchildren(newVnode, node, parentContext);
    } else {
        updateVChildren(vnode, newVnode, node, parentContext);
        updateVelem(vnode, newVnode, node, parentContext);
    }
    return node;
}

function updateVChildren(vnode, newVnode, node, parentContext) {
    var patches = {
        removes: [],
        updates: [],
        creates: []
    };
    diffVchildren(patches, vnode, newVnode, node, parentContext);
    flatEach(patches.removes, applyDestroy);
    flatEach(patches.updates, applyUpdate);
    flatEach(patches.creates, applyCreate);
}

function applyUpdate(data) {
    if (!data) {
        return;
    }
    var vnode = data.vnode;
    var newNode = data.node;

    // update
    if (!data.shouldIgnore) {
        if (!vnode.vtype) {
            newNode.replaceData(0, newNode.length, data.newVnode);
        } else if (vnode.vtype === VELEMENT) {
            updateVelem(vnode, data.newVnode, newNode, data.parentContext);
        } else if (vnode.vtype === VSTATELESS) {
            newNode = updateVstateless(vnode, data.newVnode, newNode, data.parentContext);
        } else if (vnode.vtype === VCOMPONENT) {
            newNode = updateVcomponent(vnode, data.newVnode, newNode, data.parentContext);
        }
    }

    // re-order
    var currentNode = newNode.parentNode.childNodes[data.index];
    if (currentNode !== newNode) {
        newNode.parentNode.insertBefore(newNode, currentNode);
    }
    return newNode;
}

function applyDestroy(data) {
    destroyVnode(data.vnode, data.node);
    data.node.parentNode.removeChild(data.node);
}

function applyCreate(data) {
    var node = initVnode(data.vnode, data.parentContext, data.parentNode.namespaceURI);
    data.parentNode.insertBefore(node, data.parentNode.childNodes[data.index]);
}

/**
 * Only vnode which has props.children need to call destroy function
 * to check whether subTree has component that need to call lify-cycle method and release cache.
 */

function destroyVnode(vnode, node) {
    var vtype = vnode.vtype;

    if (vtype === VELEMENT) {
        // destroy element
        destroyVelem(vnode, node);
    } else if (vtype === VCOMPONENT) {
        // destroy state component
        destroyVcomponent(vnode, node);
    } else if (vtype === VSTATELESS) {
        // destroy stateless component
        destroyVstateless(vnode, node);
    }
}

function initVelem(velem, parentContext, namespaceURI) {
    var type = velem.type;
    var props = velem.props;

    var node = null;

    if (type === 'svg' || namespaceURI === SVGNamespaceURI) {
        node = document.createElementNS(SVGNamespaceURI, type);
        namespaceURI = SVGNamespaceURI;
    } else {
        node = document.createElement(type);
    }

    initVchildren(velem, node, parentContext);

    var isCustomComponent = type.indexOf('-') >= 0 || props.is != null;
    setProps(node, props, isCustomComponent);

    if (velem.ref != null) {
        addItem(pendingRefs, velem);
        addItem(pendingRefs, node);
    }

    return node;
}

function initVchildren(velem, node, parentContext) {
    var vchildren = node.vchildren = getFlattenChildren(velem);
    var namespaceURI = node.namespaceURI;
    for (var i = 0, len = vchildren.length; i < len; i++) {
        node.appendChild(initVnode(vchildren[i], parentContext, namespaceURI));
    }
}

function getFlattenChildren(vnode) {
    var children = vnode.props.children;

    var vchildren = [];
    if (isArr(children)) {
        flatEach(children, collectChild, vchildren);
    } else {
        collectChild(children, vchildren);
    }
    return vchildren;
}

function collectChild(child, children) {
    if (child != null && typeof child !== 'boolean') {
        if (!child.vtype) {
            // convert immutablejs data
            if (child.toJS) {
                child = child.toJS();
                if (isArr(child)) {
                    flatEach(child, collectChild, children);
                } else {
                    collectChild(child, children);
                }
                return;
            }
            child = '' + child;
        }
        children[children.length] = child;
    }
}

function diffVchildren(patches, vnode, newVnode, node, parentContext) {
    var childNodes = node.childNodes;
    var vchildren = node.vchildren;

    var newVchildren = node.vchildren = getFlattenChildren(newVnode);
    var vchildrenLen = vchildren.length;
    var newVchildrenLen = newVchildren.length;

    if (vchildrenLen === 0) {
        if (newVchildrenLen > 0) {
            for (var i = 0; i < newVchildrenLen; i++) {
                addItem(patches.creates, {
                    vnode: newVchildren[i],
                    parentNode: node,
                    parentContext: parentContext,
                    index: i
                });
            }
        }
        return;
    } else if (newVchildrenLen === 0) {
        for (var i = 0; i < vchildrenLen; i++) {
            addItem(patches.removes, {
                vnode: vchildren[i],
                node: childNodes[i]
            });
        }
        return;
    }

    var updates = Array(newVchildrenLen);
    var removes = null;
    var creates = null;

    // isEqual
    for (var i = 0; i < vchildrenLen; i++) {
        var _vnode = vchildren[i];
        for (var j = 0; j < newVchildrenLen; j++) {
            if (updates[j]) {
                continue;
            }
            var _newVnode = newVchildren[j];
            if (_vnode === _newVnode) {
                var shouldIgnore = true;
                if (parentContext) {
                    if (_vnode.vtype === VCOMPONENT || _vnode.vtype === VSTATELESS) {
                        if (_vnode.type.contextTypes) {
                            shouldIgnore = false;
                        }
                    }
                }
                updates[j] = {
                    shouldIgnore: shouldIgnore,
                    vnode: _vnode,
                    newVnode: _newVnode,
                    node: childNodes[i],
                    parentContext: parentContext,
                    index: j
                };
                vchildren[i] = null;
                break;
            }
        }
    }

    // isSimilar
    for (var i = 0; i < vchildrenLen; i++) {
        var _vnode2 = vchildren[i];
        if (_vnode2 === null) {
            continue;
        }
        var shouldRemove = true;
        for (var j = 0; j < newVchildrenLen; j++) {
            if (updates[j]) {
                continue;
            }
            var _newVnode2 = newVchildren[j];
            if (_newVnode2.type === _vnode2.type && _newVnode2.key === _vnode2.key && _newVnode2.refs === _vnode2.refs) {
                updates[j] = {
                    vnode: _vnode2,
                    newVnode: _newVnode2,
                    node: childNodes[i],
                    parentContext: parentContext,
                    index: j
                };
                shouldRemove = false;
                break;
            }
        }
        if (shouldRemove) {
            if (!removes) {
                removes = [];
            }
            addItem(removes, {
                vnode: _vnode2,
                node: childNodes[i]
            });
        }
    }

    for (var i = 0; i < newVchildrenLen; i++) {
        var item = updates[i];
        if (!item) {
            if (!creates) {
                creates = [];
            }
            addItem(creates, {
                vnode: newVchildren[i],
                parentNode: node,
                parentContext: parentContext,
                index: i
            });
        } else if (item.vnode.vtype === VELEMENT) {
            diffVchildren(patches, item.vnode, item.newVnode, item.node, item.parentContext);
        }
    }

    if (removes) {
        addItem(patches.removes, removes);
    }
    if (creates) {
        addItem(patches.creates, creates);
    }
    addItem(patches.updates, updates);
}

function updateVelem(velem, newVelem, node) {
    var isCustomComponent = velem.type.indexOf('-') >= 0 || velem.props.is != null;
    patchProps(node, velem.props, newVelem.props, isCustomComponent);
    if (velem.ref !== newVelem.ref) {
        detachRef(velem.refs, velem.ref, node);
        attachRef(newVelem.refs, newVelem.ref, node);
    }
    return node;
}

function destroyVelem(velem, node) {
    var props = velem.props;
    var vchildren = node.vchildren;
    var childNodes = node.childNodes;

    for (var i = 0, len = vchildren.length; i < len; i++) {
        destroyVnode(vchildren[i], childNodes[i]);
    }
    detachRef(velem.refs, velem.ref, node);
    node.eventStore = node.vchildren = null;
}

function initVstateless(vstateless, parentContext, namespaceURI) {
    var vnode = renderVstateless(vstateless, parentContext);
    var node = initVnode(vnode, parentContext, namespaceURI);
    node.cache = node.cache || {};
    node.cache[vstateless.uid] = vnode;
    return node;
}

function updateVstateless(vstateless, newVstateless, node, parentContext) {
    var uid = vstateless.uid;
    var vnode = node.cache[uid];
    delete node.cache[uid];
    var newVnode = renderVstateless(newVstateless, parentContext);
    var newNode = compareTwoVnodes(vnode, newVnode, node, parentContext);
    newNode.cache = newNode.cache || {};
    newNode.cache[newVstateless.uid] = newVnode;
    if (newNode !== node) {
        syncCache(newNode.cache, node.cache, newNode);
    }
    return newNode;
}

function destroyVstateless(vstateless, node) {
    var uid = vstateless.uid;
    var vnode = node.cache[uid];
    delete node.cache[uid];
    destroyVnode(vnode, node);
}

function renderVstateless(vstateless, parentContext) {
    var factory = vstateless.type;
    var props = vstateless.props;

    var componentContext = getContextByTypes(parentContext, factory.contextTypes);
    var vnode = factory(props, componentContext);
    if (vnode && vnode.render) {
        vnode = vnode.render();
    }
    if (vnode === null || vnode === false) {
        vnode = createVnode(VCOMMENT);
    } else if (!vnode || !vnode.vtype) {
        throw new Error('@' + factory.name + '#render:You may have returned undefined, an array or some other invalid object');
    }
    return vnode;
}

function initVcomponent(vcomponent, parentContext, namespaceURI) {
    var Component = vcomponent.type;
    var props = vcomponent.props;
    var uid = vcomponent.uid;

    var componentContext = getContextByTypes(parentContext, Component.contextTypes);
    var component = new Component(props, componentContext);
    var updater = component.$updater;
    var cache = component.$cache;

    cache.parentContext = parentContext;
    updater.isPending = true;
    component.props = component.props || props;
    component.context = component.context || componentContext;
    if (component.componentWillMount) {
        component.componentWillMount();
        component.state = updater.getState();
    }
    var vnode = renderComponent(component);
    var node = initVnode(vnode, getChildContext(component, parentContext), namespaceURI);
    node.cache = node.cache || {};
    node.cache[uid] = component;
    cache.vnode = vnode;
    cache.node = node;
    cache.isMounted = true;
    addItem(pendingComponents, component);

    if (vcomponent.ref != null) {
        addItem(pendingRefs, vcomponent);
        addItem(pendingRefs, component);
    }

    return node;
}

function updateVcomponent(vcomponent, newVcomponent, node, parentContext) {
    var uid = vcomponent.uid;
    var component = node.cache[uid];
    var updater = component.$updater;
    var cache = component.$cache;
    var Component = newVcomponent.type;
    var nextProps = newVcomponent.props;

    var componentContext = getContextByTypes(parentContext, Component.contextTypes);
    delete node.cache[uid];
    node.cache[newVcomponent.uid] = component;
    cache.parentContext = parentContext;
    if (component.componentWillReceiveProps) {
        var needToggleIsPending = !updater.isPending;
        if (needToggleIsPending) updater.isPending = true;
        component.componentWillReceiveProps(nextProps, componentContext);
        if (needToggleIsPending) updater.isPending = false;
    }

    if (vcomponent.ref !== newVcomponent.ref) {
        detachRef(vcomponent.refs, vcomponent.ref, component);
        attachRef(newVcomponent.refs, newVcomponent.ref, component);
    }

    updater.emitUpdate(nextProps, componentContext);

    return cache.node;
}

function destroyVcomponent(vcomponent, node) {
    var uid = vcomponent.uid;
    var component = node.cache[uid];
    var cache = component.$cache;
    delete node.cache[uid];
    detachRef(vcomponent.refs, vcomponent.ref, component);
    component.setState = component.forceUpdate = noop;
    if (component.componentWillUnmount) {
        component.componentWillUnmount();
    }
    destroyVnode(cache.vnode, node);
    delete component.setState;
    cache.isMounted = false;
    cache.node = cache.parentContext = cache.vnode = component.refs = component.context = null;
}

function getContextByTypes(curContext, contextTypes) {
    var context = {};
    if (!contextTypes || !curContext) {
        return context;
    }
    for (var key in contextTypes) {
        if (contextTypes.hasOwnProperty(key)) {
            context[key] = curContext[key];
        }
    }
    return context;
}

function renderComponent(component, parentContext) {
    refs = component.refs;
    var vnode = component.render();
    if (vnode === null || vnode === false) {
        vnode = createVnode(VCOMMENT);
    } else if (!vnode || !vnode.vtype) {
        throw new Error('@' + component.constructor.name + '#render:You may have returned undefined, an array or some other invalid object');
    }
    refs = null;
    return vnode;
}

function getChildContext(component, parentContext) {
    if (component.getChildContext) {
        var curContext = component.getChildContext();
        if (curContext) {
            parentContext = extend(extend({}, parentContext), curContext);
        }
    }
    return parentContext;
}

var pendingComponents = [];
function clearPendingComponents() {
    var len = pendingComponents.length;
    if (!len) {
        return;
    }
    var components = pendingComponents;
    pendingComponents = [];
    var i = -1;
    while (len--) {
        var component = components[++i];
        var updater = component.$updater;
        if (component.componentDidMount) {
            component.componentDidMount();
        }
        updater.isPending = false;
        updater.emitUpdate();
    }
}

var pendingRefs = [];
function clearPendingRefs() {
    var len = pendingRefs.length;
    if (!len) {
        return;
    }
    var list = pendingRefs;
    pendingRefs = [];
    for (var i = 0; i < len; i += 2) {
        var vnode = list[i];
        var refValue = list[i + 1];
        attachRef(vnode.refs, vnode.ref, refValue);
    }
}

function clearPending() {
    clearPendingRefs();
    clearPendingComponents();
}

function compareTwoVnodes(vnode, newVnode, node, parentContext) {
    var newNode = node;
    if (newVnode == null) {
        // remove
        destroyVnode(vnode, node);
        node.parentNode.removeChild(node);
    } else if (vnode.type !== newVnode.type || vnode.key !== newVnode.key) {
        // replace
        destroyVnode(vnode, node);
        newNode = initVnode(newVnode, parentContext, node.namespaceURI);
        node.parentNode.replaceChild(newNode, node);
    } else if (vnode !== newVnode || parentContext) {
        // same type and same key -> update
        newNode = updateVnode(vnode, newVnode, node, parentContext);
    }
    return newNode;
}

function getDOMNode() {
    return this;
}

function attachRef(refs, refKey, refValue) {
    if (refKey == null || !refValue) {
        return;
    }
    if (refValue.nodeName && !refValue.getDOMNode) {
        // support react v0.13 style: this.refs.myInput.getDOMNode()
        refValue.getDOMNode = getDOMNode;
    }
    if (isFn(refKey)) {
        refKey(refValue);
    } else if (refs) {
        refs[refKey] = refValue;
    }
}

function detachRef(refs, refKey, refValue) {
    if (refKey == null) {
        return;
    }
    if (isFn(refKey)) {
        refKey(null);
    } else if (refs && refs[refKey] === refValue) {
        delete refs[refKey];
    }
}

function syncCache(cache, oldCache, node) {
    for (var key in oldCache) {
        if (!oldCache.hasOwnProperty(key)) {
            continue;
        }
        var value = oldCache[key];
        cache[key] = value;

        // is component, update component.$cache.node
        if (value.forceUpdate) {
            value.$cache.node = node;
        }
    }
}

var updateQueue = {
	updaters: [],
	isPending: false,
	add: function add(updater) {
		addItem(this.updaters, updater);
	},
	batchUpdate: function batchUpdate() {
		if (this.isPending) {
			return;
		}
		this.isPending = true;
		/*
   each updater.update may add new updater to updateQueue
   clear them with a loop
   event bubbles from bottom-level to top-level
   reverse the updater order can merge some props and state and reduce the refresh times
   see Updater.update method below to know why
  */
		var updaters = this.updaters;

		var updater = undefined;
		while (updater = updaters.pop()) {
			updater.updateComponent();
		}
		this.isPending = false;
	}
};

function Updater(instance) {
	this.instance = instance;
	this.pendingStates = [];
	this.pendingCallbacks = [];
	this.isPending = false;
	this.nextProps = this.nextContext = null;
	this.clearCallbacks = this.clearCallbacks.bind(this);
}

Updater.prototype = {
	emitUpdate: function emitUpdate(nextProps, nextContext) {
		this.nextProps = nextProps;
		this.nextContext = nextContext;
		// receive nextProps!! should update immediately
		nextProps || !updateQueue.isPending ? this.updateComponent() : updateQueue.add(this);
	},
	updateComponent: function updateComponent() {
		var instance = this.instance;
		var pendingStates = this.pendingStates;
		var nextProps = this.nextProps;
		var nextContext = this.nextContext;

		if (nextProps || pendingStates.length > 0) {
			nextProps = nextProps || instance.props;
			nextContext = nextContext || instance.context;
			this.nextProps = this.nextContext = null;
			// merge the nextProps and nextState and update by one time
			shouldUpdate(instance, nextProps, this.getState(), nextContext, this.clearCallbacks);
		}
	},
	addState: function addState(nextState) {
		if (nextState) {
			addItem(this.pendingStates, nextState);
			if (!this.isPending) {
				this.emitUpdate();
			}
		}
	},
	replaceState: function replaceState(nextState) {
		var pendingStates = this.pendingStates;

		pendingStates.pop();
		// push special params to point out should replace state
		addItem(pendingStates, [nextState]);
	},
	getState: function getState() {
		var instance = this.instance;
		var pendingStates = this.pendingStates;
		var state = instance.state;
		var props = instance.props;

		if (pendingStates.length) {
			state = extend({}, state);
			pendingStates.forEach(function (nextState) {
				var isReplace = isArr(nextState);
				if (isReplace) {
					nextState = nextState[0];
				}
				if (isFn(nextState)) {
					nextState = nextState.call(instance, state, props);
				}
				// replace state
				if (isReplace) {
					state = extend({}, nextState);
				} else {
					extend(state, nextState);
				}
			});
			pendingStates.length = 0;
		}
		return state;
	},
	clearCallbacks: function clearCallbacks() {
		var pendingCallbacks = this.pendingCallbacks;
		var instance = this.instance;

		if (pendingCallbacks.length > 0) {
			this.pendingCallbacks = [];
			pendingCallbacks.forEach(function (callback) {
				return callback.call(instance);
			});
		}
	},
	addCallback: function addCallback(callback) {
		if (isFn(callback)) {
			addItem(this.pendingCallbacks, callback);
		}
	}
};
function Component(props, context) {
	this.$updater = new Updater(this);
	this.$cache = { isMounted: false };
	this.props = props;
	this.state = {};
	this.refs = {};
	this.context = context;
}

var ReactComponentSymbol = {};

Component.prototype = {
	constructor: Component,
	isReactComponent: ReactComponentSymbol,
	// getChildContext: _.noop,
	// componentWillUpdate: _.noop,
	// componentDidUpdate: _.noop,
	// componentWillReceiveProps: _.noop,
	// componentWillMount: _.noop,
	// componentDidMount: _.noop,
	// componentWillUnmount: _.noop,
	// shouldComponentUpdate(nextProps, nextState) {
	// 	return true
	// },
	forceUpdate: function forceUpdate(callback) {
		var $updater = this.$updater;
		var $cache = this.$cache;
		var props = this.props;
		var state = this.state;
		var context = this.context;

		if (!$cache.isMounted) {
			return;
		}
		// if updater is pending, add state to trigger nexttick update
		if ($updater.isPending) {
			$updater.addState(state);
			return;
		}
		var nextProps = $cache.props || props;
		var nextState = $cache.state || state;
		var nextContext = $cache.context || context;
		var parentContext = $cache.parentContext;
		var node = $cache.node;
		var vnode = $cache.vnode;
		$cache.props = $cache.state = $cache.context = null;
		$updater.isPending = true;
		if (this.componentWillUpdate) {
			this.componentWillUpdate(nextProps, nextState, nextContext);
		}
		this.state = nextState;
		this.props = nextProps;
		this.context = nextContext;
		var newVnode = renderComponent(this);
		var newNode = compareTwoVnodes(vnode, newVnode, node, getChildContext(this, parentContext));
		if (newNode !== node) {
			newNode.cache = newNode.cache || {};
			syncCache(newNode.cache, node.cache, newNode);
		}
		$cache.vnode = newVnode;
		$cache.node = newNode;
		clearPending();
		if (this.componentDidUpdate) {
			this.componentDidUpdate(props, state, context);
		}
		if (callback) {
			callback.call(this);
		}
		$updater.isPending = false;
		$updater.emitUpdate();
	},
	setState: function setState(nextState, callback) {
		var $updater = this.$updater;

		$updater.addCallback(callback);
		$updater.addState(nextState);
	},
	replaceState: function replaceState(nextState, callback) {
		var $updater = this.$updater;

		$updater.addCallback(callback);
		$updater.replaceState(nextState);
	},
	getDOMNode: function getDOMNode() {
		var node = this.$cache.node;
		return node && node.nodeName === '#comment' ? null : node;
	},
	isMounted: function isMounted() {
		return this.$cache.isMounted;
	}
};

function shouldUpdate(component, nextProps, nextState, nextContext, callback) {
	var shouldComponentUpdate = true;
	if (component.shouldComponentUpdate) {
		shouldComponentUpdate = component.shouldComponentUpdate(nextProps, nextState, nextContext);
	}
	if (shouldComponentUpdate === false) {
		component.props = nextProps;
		component.state = nextState;
		component.context = nextContext || {};
		return;
	}
	var cache = component.$cache;
	cache.props = nextProps;
	cache.state = nextState;
	cache.context = nextContext || {};
	component.forceUpdate(callback);
}

// event config
var unbubbleEvents = {
    /**
     * should not bind mousemove in document scope
     * even though mousemove event can bubble
     */
    onmousemove: 1,
    onmouseleave: 1,
    onmouseenter: 1,
    onload: 1,
    onunload: 1,
    onscroll: 1,
    onfocus: 1,
    onblur: 1,
    onrowexit: 1,
    onbeforeunload: 1,
    onstop: 1,
    ondragdrop: 1,
    ondragenter: 1,
    ondragexit: 1,
    ondraggesture: 1,
    ondragover: 1,
    oncontextmenu: 1
};

function getEventName(key) {
    if (key === 'onDoubleClick') {
        key = 'ondblclick';
    } else if (key === 'onTouchTap') {
        key = 'onclick';
    }

    return key.toLowerCase();
}

// Mobile Safari does not fire properly bubble click events on
// non-interactive elements, which means delegated click listeners do not
// fire. The workaround for this bug involves attaching an empty click
// listener on the target node.
var inMobile = ('ontouchstart' in document);
var emptyFunction = function emptyFunction() {};
var ON_CLICK_KEY = 'onclick';

var eventTypes = {};

function addEvent(elem, eventType, listener) {
    eventType = getEventName(eventType);

    var eventStore = elem.eventStore || (elem.eventStore = {});
    eventStore[eventType] = listener;

    if (unbubbleEvents[eventType] === 1) {
        elem[eventType] = dispatchUnbubbleEvent;
        return;
    } else if (!eventTypes[eventType]) {
        // onclick -> click
        document.addEventListener(eventType.substr(2), dispatchEvent, false);
        eventTypes[eventType] = true;
    }

    if (inMobile && eventType === ON_CLICK_KEY) {
        elem.addEventListener('click', emptyFunction, false);
        return;
    }

    var nodeName = elem.nodeName;

    if (eventType === 'onchange') {
        addEvent(elem, 'oninput', listener);
    }
}

function removeEvent(elem, eventType) {
    eventType = getEventName(eventType);

    var eventStore = elem.eventStore || (elem.eventStore = {});
    delete eventStore[eventType];

    if (unbubbleEvents[eventType] === 1) {
        elem[eventType] = null;
        return;
    } else if (inMobile && eventType === ON_CLICK_KEY) {
        elem.removeEventListener('click', emptyFunction, false);
        return;
    }

    var nodeName = elem.nodeName;

    if (eventType === 'onchange') {
        delete eventStore['oninput'];
    }
}

function dispatchEvent(event) {
    var target = event.target;
    var type = event.type;

    var eventType = 'on' + type;
    var syntheticEvent = undefined;

    updateQueue.isPending = true;
    while (target) {
        var _target = target;
        var eventStore = _target.eventStore;

        var listener = eventStore && eventStore[eventType];
        if (!listener) {
            target = target.parentNode;
            continue;
        }
        if (!syntheticEvent) {
            syntheticEvent = createSyntheticEvent(event);
        }
        syntheticEvent.currentTarget = target;
        listener.call(target, syntheticEvent);
        if (syntheticEvent.$cancelBubble) {
            break;
        }
        target = target.parentNode;
    }
    updateQueue.isPending = false;
    updateQueue.batchUpdate();
}

function dispatchUnbubbleEvent(event) {
    var target = event.currentTarget || event.target;
    var eventType = 'on' + event.type;
    var syntheticEvent = createSyntheticEvent(event);

    syntheticEvent.currentTarget = target;
    updateQueue.isPending = true;

    var eventStore = target.eventStore;

    var listener = eventStore && eventStore[eventType];
    if (listener) {
        listener.call(target, syntheticEvent);
    }

    updateQueue.isPending = false;
    updateQueue.batchUpdate();
}

function createSyntheticEvent(nativeEvent) {
    var syntheticEvent = {};
    var cancelBubble = function cancelBubble() {
        return syntheticEvent.$cancelBubble = true;
    };
    syntheticEvent.nativeEvent = nativeEvent;
    syntheticEvent.persist = noop;
    for (var key in nativeEvent) {
        if (typeof nativeEvent[key] !== 'function') {
            syntheticEvent[key] = nativeEvent[key];
        } else if (key === 'stopPropagation' || key === 'stopImmediatePropagation') {
            syntheticEvent[key] = cancelBubble;
        } else {
            syntheticEvent[key] = nativeEvent[key].bind(nativeEvent);
        }
    }
    return syntheticEvent;
}

function setStyle(elemStyle, styles) {
    for (var styleName in styles) {
        if (styles.hasOwnProperty(styleName)) {
            setStyleValue(elemStyle, styleName, styles[styleName]);
        }
    }
}

function removeStyle(elemStyle, styles) {
    for (var styleName in styles) {
        if (styles.hasOwnProperty(styleName)) {
            elemStyle[styleName] = '';
        }
    }
}

function patchStyle(elemStyle, style, newStyle) {
    if (style === newStyle) {
        return;
    }
    if (!newStyle && style) {
        removeStyle(elemStyle, style);
        return;
    } else if (newStyle && !style) {
        setStyle(elemStyle, newStyle);
        return;
    }

    for (var key in style) {
        if (newStyle.hasOwnProperty(key)) {
            if (newStyle[key] !== style[key]) {
                setStyleValue(elemStyle, key, newStyle[key]);
            }
        } else {
            elemStyle[key] = '';
        }
    }
    for (var key in newStyle) {
        if (!style.hasOwnProperty(key)) {
            setStyleValue(elemStyle, key, newStyle[key]);
        }
    }
}

/**
 * CSS properties which accept numbers but are not in units of "px".
 */
var isUnitlessNumber = {
    animationIterationCount: 1,
    borderImageOutset: 1,
    borderImageSlice: 1,
    borderImageWidth: 1,
    boxFlex: 1,
    boxFlexGroup: 1,
    boxOrdinalGroup: 1,
    columnCount: 1,
    flex: 1,
    flexGrow: 1,
    flexPositive: 1,
    flexShrink: 1,
    flexNegative: 1,
    flexOrder: 1,
    gridRow: 1,
    gridColumn: 1,
    fontWeight: 1,
    lineClamp: 1,
    lineHeight: 1,
    opacity: 1,
    order: 1,
    orphans: 1,
    tabSize: 1,
    widows: 1,
    zIndex: 1,
    zoom: 1,

    // SVG-related properties
    fillOpacity: 1,
    floodOpacity: 1,
    stopOpacity: 1,
    strokeDasharray: 1,
    strokeDashoffset: 1,
    strokeMiterlimit: 1,
    strokeOpacity: 1,
    strokeWidth: 1
};

function prefixKey(prefix, key) {
    return prefix + key.charAt(0).toUpperCase() + key.substring(1);
}

var prefixes = ['Webkit', 'ms', 'Moz', 'O'];

Object.keys(isUnitlessNumber).forEach(function (prop) {
    prefixes.forEach(function (prefix) {
        isUnitlessNumber[prefixKey(prefix, prop)] = 1;
    });
});

var RE_NUMBER = /^-?\d+(\.\d+)?$/;
function setStyleValue(elemStyle, styleName, styleValue) {

    if (!isUnitlessNumber[styleName] && RE_NUMBER.test(styleValue)) {
        elemStyle[styleName] = styleValue + 'px';
        return;
    }

    if (styleName === 'float') {
        styleName = 'cssFloat';
    }

    if (styleValue == null || typeof styleValue === 'boolean') {
        styleValue = '';
    }

    elemStyle[styleName] = styleValue;
}

var ATTRIBUTE_NAME_START_CHAR = ':A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD';
var ATTRIBUTE_NAME_CHAR = ATTRIBUTE_NAME_START_CHAR + '\\-.0-9\\uB7\\u0300-\\u036F\\u203F-\\u2040';

var VALID_ATTRIBUTE_NAME_REGEX = new RegExp('^[' + ATTRIBUTE_NAME_START_CHAR + '][' + ATTRIBUTE_NAME_CHAR + ']*$');

var isCustomAttribute = RegExp.prototype.test.bind(new RegExp('^(data|aria)-[' + ATTRIBUTE_NAME_CHAR + ']*$'));
// will merge some data in properties below
var properties = {};

/**
 * Mapping from normalized, camelcased property names to a configuration that
 * specifies how the associated DOM property should be accessed or rendered.
 */
var MUST_USE_PROPERTY = 0x1;
var HAS_BOOLEAN_VALUE = 0x4;
var HAS_NUMERIC_VALUE = 0x8;
var HAS_POSITIVE_NUMERIC_VALUE = 0x10 | 0x8;
var HAS_OVERLOADED_BOOLEAN_VALUE = 0x20;

// html config
var HTMLDOMPropertyConfig = {
    props: {
        /**
         * Standard Properties
         */
        accept: 0,
        acceptCharset: 0,
        accessKey: 0,
        action: 0,
        allowFullScreen: HAS_BOOLEAN_VALUE,
        allowTransparency: 0,
        alt: 0,
        async: HAS_BOOLEAN_VALUE,
        autoComplete: 0,
        autoFocus: HAS_BOOLEAN_VALUE,
        autoPlay: HAS_BOOLEAN_VALUE,
        capture: HAS_BOOLEAN_VALUE,
        cellPadding: 0,
        cellSpacing: 0,
        charSet: 0,
        challenge: 0,
        checked: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
        cite: 0,
        classID: 0,
        className: 0,
        cols: HAS_POSITIVE_NUMERIC_VALUE,
        colSpan: 0,
        content: 0,
        contentEditable: 0,
        contextMenu: 0,
        controls: HAS_BOOLEAN_VALUE,
        coords: 0,
        crossOrigin: 0,
        data: 0, // For `<object />` acts as `src`.
        dateTime: 0,
        'default': HAS_BOOLEAN_VALUE,
        // not in regular react, they did it in other way
        defaultValue: MUST_USE_PROPERTY,
        // not in regular react, they did it in other way
        defaultChecked: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
        defer: HAS_BOOLEAN_VALUE,
        dir: 0,
        disabled: HAS_BOOLEAN_VALUE,
        download: HAS_OVERLOADED_BOOLEAN_VALUE,
        draggable: 0,
        encType: 0,
        form: 0,
        formAction: 0,
        formEncType: 0,
        formMethod: 0,
        formNoValidate: HAS_BOOLEAN_VALUE,
        formTarget: 0,
        frameBorder: 0,
        headers: 0,
        height: 0,
        hidden: HAS_BOOLEAN_VALUE,
        high: 0,
        href: 0,
        hrefLang: 0,
        htmlFor: 0,
        httpEquiv: 0,
        icon: 0,
        id: 0,
        inputMode: 0,
        integrity: 0,
        is: 0,
        keyParams: 0,
        keyType: 0,
        kind: 0,
        label: 0,
        lang: 0,
        list: 0,
        loop: HAS_BOOLEAN_VALUE,
        low: 0,
        manifest: 0,
        marginHeight: 0,
        marginWidth: 0,
        max: 0,
        maxLength: 0,
        media: 0,
        mediaGroup: 0,
        method: 0,
        min: 0,
        minLength: 0,
        // Caution; `option.selected` is not updated if `select.multiple` is
        // disabled with `removeAttribute`.
        multiple: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
        muted: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
        name: 0,
        nonce: 0,
        noValidate: HAS_BOOLEAN_VALUE,
        open: HAS_BOOLEAN_VALUE,
        optimum: 0,
        pattern: 0,
        placeholder: 0,
        poster: 0,
        preload: 0,
        profile: 0,
        radioGroup: 0,
        readOnly: HAS_BOOLEAN_VALUE,
        referrerPolicy: 0,
        rel: 0,
        required: HAS_BOOLEAN_VALUE,
        reversed: HAS_BOOLEAN_VALUE,
        role: 0,
        rows: HAS_POSITIVE_NUMERIC_VALUE,
        rowSpan: HAS_NUMERIC_VALUE,
        sandbox: 0,
        scope: 0,
        scoped: HAS_BOOLEAN_VALUE,
        scrolling: 0,
        seamless: HAS_BOOLEAN_VALUE,
        selected: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
        shape: 0,
        size: HAS_POSITIVE_NUMERIC_VALUE,
        sizes: 0,
        span: HAS_POSITIVE_NUMERIC_VALUE,
        spellCheck: 0,
        src: 0,
        srcDoc: 0,
        srcLang: 0,
        srcSet: 0,
        start: HAS_NUMERIC_VALUE,
        step: 0,
        style: 0,
        summary: 0,
        tabIndex: 0,
        target: 0,
        title: 0,
        // Setting .type throws on non-<input> tags
        type: 0,
        useMap: 0,
        value: MUST_USE_PROPERTY,
        width: 0,
        wmode: 0,
        wrap: 0,

        /**
         * RDFa Properties
         */
        about: 0,
        datatype: 0,
        inlist: 0,
        prefix: 0,
        // property is also supported for OpenGraph in meta tags.
        property: 0,
        resource: 0,
        'typeof': 0,
        vocab: 0,

        /**
         * Non-standard Properties
         */
        // autoCapitalize and autoCorrect are supported in Mobile Safari for
        // keyboard hints.
        autoCapitalize: 0,
        autoCorrect: 0,
        // autoSave allows WebKit/Blink to persist values of input fields on page reloads
        autoSave: 0,
        // color is for Safari mask-icon link
        color: 0,
        // itemProp, itemScope, itemType are for
        // Microdata support. See http://schema.org/docs/gs.html
        itemProp: 0,
        itemScope: HAS_BOOLEAN_VALUE,
        itemType: 0,
        // itemID and itemRef are for Microdata support as well but
        // only specified in the WHATWG spec document. See
        // https://html.spec.whatwg.org/multipage/microdata.html#microdata-dom-api
        itemID: 0,
        itemRef: 0,
        // results show looking glass icon and recent searches on input
        // search fields in WebKit/Blink
        results: 0,
        // IE-only attribute that specifies security restrictions on an iframe
        // as an alternative to the sandbox attribute on IE<10
        security: 0,
        // IE-only attribute that controls focus behavior
        unselectable: 0
    },
    attrNS: {},
    domAttrs: {
        acceptCharset: 'accept-charset',
        className: 'class',
        htmlFor: 'for',
        httpEquiv: 'http-equiv'
    },
    domProps: {}
};

// svg config
var xlink = 'http://www.w3.org/1999/xlink';
var xml = 'http://www.w3.org/XML/1998/namespace';

// We use attributes for everything SVG so let's avoid some duplication and run
// code instead.
// The following are all specified in the HTML config already so we exclude here.
// - class (as className)
// - color
// - height
// - id
// - lang
// - max
// - media
// - method
// - min
// - name
// - style
// - target
// - type
// - width
var ATTRS = {
    accentHeight: 'accent-height',
    accumulate: 0,
    additive: 0,
    alignmentBaseline: 'alignment-baseline',
    allowReorder: 'allowReorder',
    alphabetic: 0,
    amplitude: 0,
    arabicForm: 'arabic-form',
    ascent: 0,
    attributeName: 'attributeName',
    attributeType: 'attributeType',
    autoReverse: 'autoReverse',
    azimuth: 0,
    baseFrequency: 'baseFrequency',
    baseProfile: 'baseProfile',
    baselineShift: 'baseline-shift',
    bbox: 0,
    begin: 0,
    bias: 0,
    by: 0,
    calcMode: 'calcMode',
    capHeight: 'cap-height',
    clip: 0,
    clipPath: 'clip-path',
    clipRule: 'clip-rule',
    clipPathUnits: 'clipPathUnits',
    colorInterpolation: 'color-interpolation',
    colorInterpolationFilters: 'color-interpolation-filters',
    colorProfile: 'color-profile',
    colorRendering: 'color-rendering',
    contentScriptType: 'contentScriptType',
    contentStyleType: 'contentStyleType',
    cursor: 0,
    cx: 0,
    cy: 0,
    d: 0,
    decelerate: 0,
    descent: 0,
    diffuseConstant: 'diffuseConstant',
    direction: 0,
    display: 0,
    divisor: 0,
    dominantBaseline: 'dominant-baseline',
    dur: 0,
    dx: 0,
    dy: 0,
    edgeMode: 'edgeMode',
    elevation: 0,
    enableBackground: 'enable-background',
    end: 0,
    exponent: 0,
    externalResourcesRequired: 'externalResourcesRequired',
    fill: 0,
    fillOpacity: 'fill-opacity',
    fillRule: 'fill-rule',
    filter: 0,
    filterRes: 'filterRes',
    filterUnits: 'filterUnits',
    floodColor: 'flood-color',
    floodOpacity: 'flood-opacity',
    focusable: 0,
    fontFamily: 'font-family',
    fontSize: 'font-size',
    fontSizeAdjust: 'font-size-adjust',
    fontStretch: 'font-stretch',
    fontStyle: 'font-style',
    fontVariant: 'font-variant',
    fontWeight: 'font-weight',
    format: 0,
    from: 0,
    fx: 0,
    fy: 0,
    g1: 0,
    g2: 0,
    glyphName: 'glyph-name',
    glyphOrientationHorizontal: 'glyph-orientation-horizontal',
    glyphOrientationVertical: 'glyph-orientation-vertical',
    glyphRef: 'glyphRef',
    gradientTransform: 'gradientTransform',
    gradientUnits: 'gradientUnits',
    hanging: 0,
    horizAdvX: 'horiz-adv-x',
    horizOriginX: 'horiz-origin-x',
    ideographic: 0,
    imageRendering: 'image-rendering',
    'in': 0,
    in2: 0,
    intercept: 0,
    k: 0,
    k1: 0,
    k2: 0,
    k3: 0,
    k4: 0,
    kernelMatrix: 'kernelMatrix',
    kernelUnitLength: 'kernelUnitLength',
    kerning: 0,
    keyPoints: 'keyPoints',
    keySplines: 'keySplines',
    keyTimes: 'keyTimes',
    lengthAdjust: 'lengthAdjust',
    letterSpacing: 'letter-spacing',
    lightingColor: 'lighting-color',
    limitingConeAngle: 'limitingConeAngle',
    local: 0,
    markerEnd: 'marker-end',
    markerMid: 'marker-mid',
    markerStart: 'marker-start',
    markerHeight: 'markerHeight',
    markerUnits: 'markerUnits',
    markerWidth: 'markerWidth',
    mask: 0,
    maskContentUnits: 'maskContentUnits',
    maskUnits: 'maskUnits',
    mathematical: 0,
    mode: 0,
    numOctaves: 'numOctaves',
    offset: 0,
    opacity: 0,
    operator: 0,
    order: 0,
    orient: 0,
    orientation: 0,
    origin: 0,
    overflow: 0,
    overlinePosition: 'overline-position',
    overlineThickness: 'overline-thickness',
    paintOrder: 'paint-order',
    panose1: 'panose-1',
    pathLength: 'pathLength',
    patternContentUnits: 'patternContentUnits',
    patternTransform: 'patternTransform',
    patternUnits: 'patternUnits',
    pointerEvents: 'pointer-events',
    points: 0,
    pointsAtX: 'pointsAtX',
    pointsAtY: 'pointsAtY',
    pointsAtZ: 'pointsAtZ',
    preserveAlpha: 'preserveAlpha',
    preserveAspectRatio: 'preserveAspectRatio',
    primitiveUnits: 'primitiveUnits',
    r: 0,
    radius: 0,
    refX: 'refX',
    refY: 'refY',
    renderingIntent: 'rendering-intent',
    repeatCount: 'repeatCount',
    repeatDur: 'repeatDur',
    requiredExtensions: 'requiredExtensions',
    requiredFeatures: 'requiredFeatures',
    restart: 0,
    result: 0,
    rotate: 0,
    rx: 0,
    ry: 0,
    scale: 0,
    seed: 0,
    shapeRendering: 'shape-rendering',
    slope: 0,
    spacing: 0,
    specularConstant: 'specularConstant',
    specularExponent: 'specularExponent',
    speed: 0,
    spreadMethod: 'spreadMethod',
    startOffset: 'startOffset',
    stdDeviation: 'stdDeviation',
    stemh: 0,
    stemv: 0,
    stitchTiles: 'stitchTiles',
    stopColor: 'stop-color',
    stopOpacity: 'stop-opacity',
    strikethroughPosition: 'strikethrough-position',
    strikethroughThickness: 'strikethrough-thickness',
    string: 0,
    stroke: 0,
    strokeDasharray: 'stroke-dasharray',
    strokeDashoffset: 'stroke-dashoffset',
    strokeLinecap: 'stroke-linecap',
    strokeLinejoin: 'stroke-linejoin',
    strokeMiterlimit: 'stroke-miterlimit',
    strokeOpacity: 'stroke-opacity',
    strokeWidth: 'stroke-width',
    surfaceScale: 'surfaceScale',
    systemLanguage: 'systemLanguage',
    tableValues: 'tableValues',
    targetX: 'targetX',
    targetY: 'targetY',
    textAnchor: 'text-anchor',
    textDecoration: 'text-decoration',
    textRendering: 'text-rendering',
    textLength: 'textLength',
    to: 0,
    transform: 0,
    u1: 0,
    u2: 0,
    underlinePosition: 'underline-position',
    underlineThickness: 'underline-thickness',
    unicode: 0,
    unicodeBidi: 'unicode-bidi',
    unicodeRange: 'unicode-range',
    unitsPerEm: 'units-per-em',
    vAlphabetic: 'v-alphabetic',
    vHanging: 'v-hanging',
    vIdeographic: 'v-ideographic',
    vMathematical: 'v-mathematical',
    values: 0,
    vectorEffect: 'vector-effect',
    version: 0,
    vertAdvY: 'vert-adv-y',
    vertOriginX: 'vert-origin-x',
    vertOriginY: 'vert-origin-y',
    viewBox: 'viewBox',
    viewTarget: 'viewTarget',
    visibility: 0,
    widths: 0,
    wordSpacing: 'word-spacing',
    writingMode: 'writing-mode',
    x: 0,
    xHeight: 'x-height',
    x1: 0,
    x2: 0,
    xChannelSelector: 'xChannelSelector',
    xlinkActuate: 'xlink:actuate',
    xlinkArcrole: 'xlink:arcrole',
    xlinkHref: 'xlink:href',
    xlinkRole: 'xlink:role',
    xlinkShow: 'xlink:show',
    xlinkTitle: 'xlink:title',
    xlinkType: 'xlink:type',
    xmlBase: 'xml:base',
    xmlns: 0,
    xmlnsXlink: 'xmlns:xlink',
    xmlLang: 'xml:lang',
    xmlSpace: 'xml:space',
    y: 0,
    y1: 0,
    y2: 0,
    yChannelSelector: 'yChannelSelector',
    z: 0,
    zoomAndPan: 'zoomAndPan'
};

var SVGDOMPropertyConfig = {
    props: {},
    attrNS: {
        xlinkActuate: xlink,
        xlinkArcrole: xlink,
        xlinkHref: xlink,
        xlinkRole: xlink,
        xlinkShow: xlink,
        xlinkTitle: xlink,
        xlinkType: xlink,
        xmlBase: xml,
        xmlLang: xml,
        xmlSpace: xml
    },
    domAttrs: {},
    domProps: {}
};

Object.keys(ATTRS).map(function (key) {
    SVGDOMPropertyConfig.props[key] = 0;
    if (ATTRS[key]) {
        SVGDOMPropertyConfig.domAttrs[key] = ATTRS[key];
    }
});

// merge html and svg config into properties
mergeConfigToProperties(HTMLDOMPropertyConfig);
mergeConfigToProperties(SVGDOMPropertyConfig);

function mergeConfigToProperties(config) {
    var
    // all react/react-lite supporting property names in here
    props = config.props;
    var
    // attributes namespace in here
    attrNS = config.attrNS;
    var
    // propName in props which should use to be dom-attribute in here
    domAttrs = config.domAttrs;
    var
    // propName in props which should use to be dom-property in here
    domProps = config.domProps;

    for (var propName in props) {
        if (!props.hasOwnProperty(propName)) {
            continue;
        }
        var propConfig = props[propName];
        properties[propName] = {
            attributeName: domAttrs.hasOwnProperty(propName) ? domAttrs[propName] : propName.toLowerCase(),
            propertyName: domProps.hasOwnProperty(propName) ? domProps[propName] : propName,
            attributeNamespace: attrNS.hasOwnProperty(propName) ? attrNS[propName] : null,
            mustUseProperty: checkMask(propConfig, MUST_USE_PROPERTY),
            hasBooleanValue: checkMask(propConfig, HAS_BOOLEAN_VALUE),
            hasNumericValue: checkMask(propConfig, HAS_NUMERIC_VALUE),
            hasPositiveNumericValue: checkMask(propConfig, HAS_POSITIVE_NUMERIC_VALUE),
            hasOverloadedBooleanValue: checkMask(propConfig, HAS_OVERLOADED_BOOLEAN_VALUE)
        };
    }
}

function checkMask(value, bitmask) {
    return (value & bitmask) === bitmask;
}

/**
 * Sets the value for a property on a node.
 *
 * @param {DOMElement} node
 * @param {string} name
 * @param {*} value
 */

function setPropValue(node, name, value) {
    var propInfo = properties.hasOwnProperty(name) && properties[name];
    if (propInfo) {
        // should delete value from dom
        if (value == null || propInfo.hasBooleanValue && !value || propInfo.hasNumericValue && isNaN(value) || propInfo.hasPositiveNumericValue && value < 1 || propInfo.hasOverloadedBooleanValue && value === false) {
            removePropValue(node, name);
        } else if (propInfo.mustUseProperty) {
            var propName = propInfo.propertyName;
            // dom.value has side effect
            if (propName !== 'value' || '' + node[propName] !== '' + value) {
                node[propName] = value;
            }
        } else {
            var attributeName = propInfo.attributeName;
            var namespace = propInfo.attributeNamespace;

            // `setAttribute` with objects becomes only `[object]` in IE8/9,
            // ('' + value) makes it output the correct toString()-value.
            if (namespace) {
                node.setAttributeNS(namespace, attributeName, '' + value);
            } else if (propInfo.hasBooleanValue || propInfo.hasOverloadedBooleanValue && value === true) {
                node.setAttribute(attributeName, '');
            } else {
                node.setAttribute(attributeName, '' + value);
            }
        }
    } else if (isCustomAttribute(name) && VALID_ATTRIBUTE_NAME_REGEX.test(name)) {
        if (value == null) {
            node.removeAttribute(name);
        } else {
            node.setAttribute(name, '' + value);
        }
    }
}

/**
 * Deletes the value for a property on a node.
 *
 * @param {DOMElement} node
 * @param {string} name
 */

function removePropValue(node, name) {
    var propInfo = properties.hasOwnProperty(name) && properties[name];
    if (propInfo) {
        if (propInfo.mustUseProperty) {
            var propName = propInfo.propertyName;
            if (propInfo.hasBooleanValue) {
                node[propName] = false;
            } else {
                // dom.value accept string value has side effect
                if (propName !== 'value' || '' + node[propName] !== '') {
                    node[propName] = '';
                }
            }
        } else {
            node.removeAttribute(propInfo.attributeName);
        }
    } else if (isCustomAttribute(name)) {
        node.removeAttribute(name);
    }
}

function isFn(obj) {
    return typeof obj === 'function';
}

var isArr = Array.isArray;

function noop() {}

function identity(obj) {
    return obj;
}

function pipe(fn1, fn2) {
    return function () {
        fn1.apply(this, arguments);
        return fn2.apply(this, arguments);
    };
}

function addItem(list, item) {
    list[list.length] = item;
}

function flatEach(list, iteratee, a) {
    var len = list.length;
    var i = -1;

    while (len--) {
        var item = list[++i];
        if (isArr(item)) {
            flatEach(item, iteratee, a);
        } else {
            iteratee(item, a);
        }
    }
}

function extend(to, from) {
    if (!from) {
        return to;
    }
    var keys = Object.keys(from);
    var i = keys.length;
    while (i--) {
        to[keys[i]] = from[keys[i]];
    }
    return to;
}

var uid = 0;

function getUid() {
    return ++uid;
}

var EVENT_KEYS = /^on/i;

function setProp(elem, key, value, isCustomComponent) {
    if (EVENT_KEYS.test(key)) {
        addEvent(elem, key, value);
    } else if (key === 'style') {
        setStyle(elem.style, value);
    } else if (key === HTML_KEY) {
        if (value && value.__html != null) {
            elem.innerHTML = value.__html;
        }
    } else if (isCustomComponent) {
        if (value == null) {
            elem.removeAttribute(key);
        } else {
            elem.setAttribute(key, '' + value);
        }
    } else {
        setPropValue(elem, key, value);
    }
}

function removeProp(elem, key, oldValue, isCustomComponent) {
    if (EVENT_KEYS.test(key)) {
        removeEvent(elem, key);
    } else if (key === 'style') {
        removeStyle(elem.style, oldValue);
    } else if (key === HTML_KEY) {
        elem.innerHTML = '';
    } else if (isCustomComponent) {
        elem.removeAttribute(key);
    } else {
        removePropValue(elem, key);
    }
}

function patchProp(elem, key, value, oldValue, isCustomComponent) {
    if (key === 'value' || key === 'checked') {
        oldValue = elem[key];
    }
    if (value === oldValue) {
        return;
    }
    if (value === undefined) {
        removeProp(elem, key, oldValue, isCustomComponent);
        return;
    }
    if (key === 'style') {
        patchStyle(elem.style, oldValue, value);
    } else {
        setProp(elem, key, value, isCustomComponent);
    }
}

function setProps(elem, props, isCustomComponent) {
    for (var key in props) {
        if (key !== 'children') {
            setProp(elem, key, props[key], isCustomComponent);
        }
    }
}

function patchProps(elem, props, newProps, isCustomComponent) {
    for (var key in props) {
        if (key !== 'children') {
            if (newProps.hasOwnProperty(key)) {
                patchProp(elem, key, newProps[key], props[key], isCustomComponent);
            } else {
                removeProp(elem, key, props[key], isCustomComponent);
            }
        }
    }
    for (var key in newProps) {
        if (key !== 'children' && !props.hasOwnProperty(key)) {
            setProp(elem, key, newProps[key], isCustomComponent);
        }
    }
}

if (!Object.freeze) {
    Object.freeze = identity;
}

function isValidContainer(node) {
	return !!(node && (node.nodeType === ELEMENT_NODE_TYPE || node.nodeType === DOC_NODE_TYPE || node.nodeType === DOCUMENT_FRAGMENT_NODE_TYPE));
}

var pendingRendering = {};
var vnodeStore = {};
function renderTreeIntoContainer(vnode, container, callback, parentContext) {
	if (!vnode.vtype) {
		throw new Error('cannot render ' + vnode + ' to container');
	}
	if (!isValidContainer(container)) {
		throw new Error('container ' + container + ' is not a DOM element');
	}
	var id = container[COMPONENT_ID] || (container[COMPONENT_ID] = getUid());
	var argsCache = pendingRendering[id];

	// component lify cycle method maybe call root rendering
	// should bundle them and render by only one time
	if (argsCache) {
		if (argsCache === true) {
			pendingRendering[id] = argsCache = { vnode: vnode, callback: callback, parentContext: parentContext };
		} else {
			argsCache.vnode = vnode;
			argsCache.parentContext = parentContext;
			argsCache.callback = argsCache.callback ? pipe(argsCache.callback, callback) : callback;
		}
		return;
	}

	pendingRendering[id] = true;
	var oldVnode = null;
	var rootNode = null;
	if (oldVnode = vnodeStore[id]) {
		rootNode = compareTwoVnodes(oldVnode, vnode, container.firstChild, parentContext);
	} else {
		rootNode = initVnode(vnode, parentContext, container.namespaceURI);
		var childNode = null;
		while (childNode = container.lastChild) {
			container.removeChild(childNode);
		}
		container.appendChild(rootNode);
	}
	vnodeStore[id] = vnode;
	var isPending = updateQueue.isPending;
	updateQueue.isPending = true;
	clearPending();
	argsCache = pendingRendering[id];
	delete pendingRendering[id];

	var result = null;
	if (typeof argsCache === 'object') {
		result = renderTreeIntoContainer(argsCache.vnode, container, argsCache.callback, argsCache.parentContext);
	} else if (vnode.vtype === VELEMENT) {
		result = rootNode;
	} else if (vnode.vtype === VCOMPONENT) {
		result = rootNode.cache[vnode.uid];
	}

	if (!isPending) {
		updateQueue.isPending = false;
		updateQueue.batchUpdate();
	}

	if (callback) {
		callback.call(result);
	}

	return result;
}

function render(vnode, container, callback) {
	return renderTreeIntoContainer(vnode, container, callback);
}

function unstable_renderSubtreeIntoContainer(parentComponent, subVnode, container, callback) {
	var context = parentComponent.$cache.parentContext;
	return renderTreeIntoContainer(subVnode, container, callback, context);
}

function unmountComponentAtNode(container) {
	if (!container.nodeName) {
		throw new Error('expect node');
	}
	var id = container[COMPONENT_ID];
	var vnode = null;
	if (vnode = vnodeStore[id]) {
		destroyVnode(vnode, container.firstChild);
		container.removeChild(container.firstChild);
		delete vnodeStore[id];
		return true;
	}
	return false;
}

function findDOMNode(node) {
	if (node == null) {
		return null;
	}
	if (node.nodeName) {
		return node;
	}
	var component = node;
	// if component.node equal to false, component must be unmounted
	if (component.getDOMNode && component.$cache.isMounted) {
		return component.getDOMNode();
	}
	throw new Error('findDOMNode can not find Node');
}

var ReactDOM = Object.freeze({
	render: render,
	unstable_renderSubtreeIntoContainer: unstable_renderSubtreeIntoContainer,
	unmountComponentAtNode: unmountComponentAtNode,
	findDOMNode: findDOMNode
});

function createElement(type, props, children) {
	var vtype = null;
	if (typeof type === 'string') {
		vtype = VELEMENT;
	} else if (typeof type === 'function') {
		if (type.prototype && type.prototype.isReactComponent) {
			vtype = VCOMPONENT;
		} else {
			vtype = VSTATELESS;
		}
	} else {
		throw new Error('React.createElement: unexpect type [ ' + type + ' ]');
	}

	var key = null;
	var ref = null;
	var finalProps = {};
	if (props != null) {
		for (var propKey in props) {
			if (!props.hasOwnProperty(propKey)) {
				continue;
			}
			if (propKey === 'key') {
				if (props.key !== undefined) {
					key = '' + props.key;
				}
			} else if (propKey === 'ref') {
				if (props.ref !== undefined) {
					ref = props.ref;
				}
			} else {
				finalProps[propKey] = props[propKey];
			}
		}
	}

	var defaultProps = type.defaultProps;

	if (defaultProps) {
		for (var propKey in defaultProps) {
			if (finalProps[propKey] === undefined) {
				finalProps[propKey] = defaultProps[propKey];
			}
		}
	}

	var argsLen = arguments.length;
	var finalChildren = children;

	if (argsLen > 3) {
		finalChildren = Array(argsLen - 2);
		for (var i = 2; i < argsLen; i++) {
			finalChildren[i - 2] = arguments[i];
		}
	}

	if (finalChildren !== undefined) {
		finalProps.children = finalChildren;
	}

	return createVnode(vtype, type, finalProps, key, ref);
}

function isValidElement(obj) {
	return obj != null && !!obj.vtype;
}

function cloneElement(originElem, props) {
	var type = originElem.type;
	var key = originElem.key;
	var ref = originElem.ref;

	var newProps = extend(extend({ key: key, ref: ref }, originElem.props), props);

	for (var _len = arguments.length, children = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
		children[_key - 2] = arguments[_key];
	}

	var vnode = createElement.apply(undefined, [type, newProps].concat(children));
	if (vnode.ref === originElem.ref) {
		vnode.refs = originElem.refs;
	}
	return vnode;
}

function createFactory(type) {
	var factory = function factory() {
		for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
			args[_key2] = arguments[_key2];
		}

		return createElement.apply(undefined, [type].concat(args));
	};
	factory.type = type;
	return factory;
}

var tagNames = 'a|abbr|address|area|article|aside|audio|b|base|bdi|bdo|big|blockquote|body|br|button|canvas|caption|cite|code|col|colgroup|data|datalist|dd|del|details|dfn|dialog|div|dl|dt|em|embed|fieldset|figcaption|figure|footer|form|h1|h2|h3|h4|h5|h6|head|header|hgroup|hr|html|i|iframe|img|input|ins|kbd|keygen|label|legend|li|link|main|map|mark|menu|menuitem|meta|meter|nav|noscript|object|ol|optgroup|option|output|p|param|picture|pre|progress|q|rp|rt|ruby|s|samp|script|section|select|small|source|span|strong|style|sub|summary|sup|table|tbody|td|textarea|tfoot|th|thead|time|title|tr|track|u|ul|var|video|wbr|circle|clipPath|defs|ellipse|g|image|line|linearGradient|mask|path|pattern|polygon|polyline|radialGradient|rect|stop|svg|text|tspan';
var DOM = {};
tagNames.split('|').forEach(function (tagName) {
	DOM[tagName] = createFactory(tagName);
});

var check = function check() {
    return check;
};
check.isRequired = check;
var PropTypes = {
    "array": check,
    "bool": check,
    "func": check,
    "number": check,
    "object": check,
    "string": check,
    "any": check,
    "arrayOf": check,
    "element": check,
    "instanceOf": check,
    "node": check,
    "objectOf": check,
    "oneOf": check,
    "oneOfType": check,
    "shape": check
};

function only(children) {
	if (isValidElement(children)) {
		return children;
	}
	throw new Error('expect only one child');
}

function forEach(children, iteratee, context) {
	if (children == null) {
		return children;
	}
	var index = 0;
	if (isArr(children)) {
		flatEach(children, function (child) {
			iteratee.call(context, child, index++);
		});
	} else {
		iteratee.call(context, children, index);
	}
}

function map(children, iteratee, context) {
	if (children == null) {
		return children;
	}
	var store = [];
	var keyMap = {};
	forEach(children, function (child, index) {
		var data = {};
		data.child = iteratee.call(context, child, index) || child;
		data.isEqual = data.child === child;
		var key = data.key = getKey(child, index);
		if (keyMap.hasOwnProperty(key)) {
			keyMap[key] += 1;
		} else {
			keyMap[key] = 0;
		}
		data.index = keyMap[key];
		addItem(store, data);
	});
	var result = [];
	store.forEach(function (_ref) {
		var child = _ref.child;
		var key = _ref.key;
		var index = _ref.index;
		var isEqual = _ref.isEqual;

		if (child == null || typeof child === 'boolean') {
			return;
		}
		if (!isValidElement(child) || key == null) {
			addItem(result, child);
			return;
		}
		if (keyMap[key] !== 0) {
			key += ':' + index;
		}
		if (!isEqual) {
			key = escapeUserProvidedKey(child.key || '') + '/' + key;
		}
		child = cloneElement(child, { key: key });
		addItem(result, child);
	});
	return result;
}

function count(children) {
	var count = 0;
	forEach(children, function () {
		count++;
	});
	return count;
}

function toArray(children) {
	return map(children, identity) || [];
}

function getKey(child, index) {
	var key = undefined;
	if (isValidElement(child) && typeof child.key === 'string') {
		key = '.$' + child.key;
	} else {
		key = '.' + index.toString(36);
	}
	return key;
}

var userProvidedKeyEscapeRegex = /\/(?!\/)/g;
function escapeUserProvidedKey(text) {
	return ('' + text).replace(userProvidedKeyEscapeRegex, '//');
}

var Children = Object.freeze({
	only: only,
	forEach: forEach,
	map: map,
	count: count,
	toArray: toArray
});

function eachMixin(mixins, iteratee) {
	mixins.forEach(function (mixin) {
		if (mixin) {
			if (isArr(mixin.mixins)) {
				eachMixin(mixin.mixins, iteratee);
			}
			iteratee(mixin);
		}
	});
}

function combineMixinToProto(proto, mixin) {
	for (var key in mixin) {
		if (!mixin.hasOwnProperty(key)) {
			continue;
		}
		var value = mixin[key];
		if (key === 'getInitialState') {
			addItem(proto.$getInitialStates, value);
			continue;
		}
		var curValue = proto[key];
		if (isFn(curValue) && isFn(value)) {
			proto[key] = pipe(curValue, value);
		} else {
			proto[key] = value;
		}
	}
}

function combineMixinToClass(Component, mixin) {
	if (mixin.propTypes) {
		Component.propTypes = Component.propTypes || {};
		extend(Component.propTypes, mixin.propTypes);
	}
	if (mixin.contextTypes) {
		Component.contextTypes = Component.contextTypes || {};
		extend(Component.contextTypes, mixin.contextTypes);
	}
	extend(Component, mixin.statics);
	if (isFn(mixin.getDefaultProps)) {
		Component.defaultProps = Component.defaultProps || {};
		extend(Component.defaultProps, mixin.getDefaultProps());
	}
}

function bindContext(obj, source) {
	for (var key in source) {
		if (source.hasOwnProperty(key)) {
			if (isFn(source[key])) {
				obj[key] = source[key].bind(obj);
			}
		}
	}
}

var Facade = function Facade() {};
Facade.prototype = Component.prototype;

function getInitialState() {
	var _this = this;

	var state = {};
	var setState = this.setState;
	this.setState = Facade;
	this.$getInitialStates.forEach(function (getInitialState) {
		if (isFn(getInitialState)) {
			extend(state, getInitialState.call(_this));
		}
	});
	this.setState = setState;
	return state;
}
function createClass(spec) {
	if (!isFn(spec.render)) {
		throw new Error('createClass: spec.render is not function');
	}
	var specMixins = spec.mixins || [];
	var mixins = specMixins.concat(spec);
	spec.mixins = null;
	function Klass(props, context) {
		Component.call(this, props, context);
		this.constructor = Klass;
		spec.autobind !== false && bindContext(this, Klass.prototype);
		this.state = this.getInitialState() || this.state;
	}
	Klass.displayName = spec.displayName;
	var proto = Klass.prototype = new Facade();
	proto.$getInitialStates = [];
	eachMixin(mixins, function (mixin) {
		combineMixinToProto(proto, mixin);
		combineMixinToClass(Klass, mixin);
	});
	proto.getInitialState = getInitialState;
	spec.mixins = specMixins;
	return Klass;
}

function shallowEqual(objA, objB) {
    if (objA === objB) {
        return true;
    }

    if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
        return false;
    }

    var keysA = Object.keys(objA);
    var keysB = Object.keys(objB);

    if (keysA.length !== keysB.length) {
        return false;
    }

    // Test for A's keys different from B.
    for (var i = 0; i < keysA.length; i++) {
        if (!objB.hasOwnProperty(keysA[i]) || objA[keysA[i]] !== objB[keysA[i]]) {
            return false;
        }
    }

    return true;
}

function PureComponent(props, context) {
	Component.call(this, props, context);
}

PureComponent.prototype = Object.create(Component.prototype);
PureComponent.prototype.constructor = PureComponent;
PureComponent.prototype.isPureReactComponent = true;
PureComponent.prototype.shouldComponentUpdate = shallowCompare;

function shallowCompare(nextProps, nextState) {
	return !shallowEqual(this.props, nextProps) || !shallowEqual(this.state, nextState);
}

var React = extend({
    version: '0.15.1',
    cloneElement: cloneElement,
    isValidElement: isValidElement,
    createElement: createElement,
    createFactory: createFactory,
    Component: Component,
    PureComponent: PureComponent,
    createClass: createClass,
    Children: Children,
    PropTypes: PropTypes,
    DOM: DOM
}, ReactDOM);

React.__SECRET_DOM_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = ReactDOM;

module.exports = React;

/***/ })

},[0]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9+L3JlYWN0LWxpdGUvZGlzdC9yZWFjdC1saXRlLmNvbW1vbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0EsU0FBUztBQUNUO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsMkNBQTJDLFNBQVM7QUFDcEQ7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLDJCQUEyQixxQkFBcUI7QUFDaEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsdUJBQXVCLGtCQUFrQjtBQUN6QztBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLG1CQUFtQixrQkFBa0I7QUFDckM7QUFDQSx1QkFBdUIscUJBQXFCO0FBQzVDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxtQkFBbUIsa0JBQWtCO0FBQ3JDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUIscUJBQXFCO0FBQzVDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTs7QUFFQSxtQkFBbUIscUJBQXFCO0FBQ3hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiLFNBQVM7QUFDVDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsMkNBQTJDLFNBQVM7QUFDcEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDRDQUE0QztBQUM1QztBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLFNBQVM7QUFDNUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxFQUFFO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxFQUFFO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEVBQUU7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEVBQUU7QUFDRjtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLEVBQUU7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0Esb0JBQW9CO0FBQ3BCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0JBQXNCO0FBQ3RCLEtBQUs7QUFDTDtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBLEVBQUU7QUFDRjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQSxFQUFFO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQjtBQUNoQjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsRUFBRTtBQUNGO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLEVBQUU7QUFDRjtBQUNBOztBQUVBO0FBQ0E7QUFDQSxFQUFFO0FBQ0Y7QUFDQTtBQUNBO0FBQ0EsRUFBRTtBQUNGO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQSw2REFBNkQ7QUFDN0Q7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUEsNkRBQTZEO0FBQzdEOztBQUVBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMLENBQUM7O0FBRUQ7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CO0FBQ25CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTCxjQUFjO0FBQ2Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTCxnQkFBZ0I7QUFDaEI7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsV0FBVyxXQUFXO0FBQ3RCLFdBQVcsT0FBTztBQUNsQixXQUFXLEVBQUU7QUFDYjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsV0FBVztBQUN0QixXQUFXLE9BQU87QUFDbEI7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQSxLQUFLO0FBQ0w7QUFDQSxLQUFLO0FBQ0w7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVDQUF1QztBQUN2QyxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxFQUFFO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsRUFBRTtBQUNGO0FBQ0EsRUFBRTtBQUNGO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBLEVBQUU7QUFDRjtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQSxFQUFFO0FBQ0Y7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLGlCQUFpQixhQUFhO0FBQzlCO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsK0JBQStCLHFCQUFxQjs7QUFFcEQsdUZBQXVGLGFBQWE7QUFDcEc7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLG9FQUFvRSxlQUFlO0FBQ25GO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7O0FBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNILEVBQUU7QUFDRjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQSxFQUFFO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0JBQStCLFdBQVc7QUFDMUM7QUFDQSxFQUFFO0FBQ0Y7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEVBQUU7QUFDRjtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEVBQUU7QUFDRjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDOztBQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxFQUFFO0FBQ0Y7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxFQUFFO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxFQUFFO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0EsbUJBQW1CLGtCQUFrQjtBQUNyQztBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQzs7QUFFRDs7QUFFQSx1QiIsImZpbGUiOiJ2ZW5kb3IuZGJlM2I0N2MzYWQ1NjAxNDRjNDMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiFcbiAqIHJlYWN0LWxpdGUuanMgdjAuMTUuMzFcbiAqIChjKSAyMDE3IEphZGUgR3VcbiAqIFJlbGVhc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgSFRNTF9LRVkgPSAnZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUwnO1xudmFyIFNWR05hbWVzcGFjZVVSSSA9ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc7XG52YXIgQ09NUE9ORU5UX0lEID0gJ2xpdGVpZCc7XG52YXIgVkVMRU1FTlQgPSAyO1xudmFyIFZTVEFURUxFU1MgPSAzO1xudmFyIFZDT01QT05FTlQgPSA0O1xudmFyIFZDT01NRU5UID0gNTtcbnZhciBFTEVNRU5UX05PREVfVFlQRSA9IDE7XG52YXIgRE9DX05PREVfVFlQRSA9IDk7XG52YXIgRE9DVU1FTlRfRlJBR01FTlRfTk9ERV9UWVBFID0gMTE7XG5cbi8qKlxyXG4gKiBjdXJyZW50IHN0YXRlZnVsIGNvbXBvbmVudCdzIHJlZnMgcHJvcGVydHlcclxuICogd2lsbCBhdHRhY2ggdG8gZXZlcnkgdm5vZGUgY3JlYXRlZCBieSBjYWxsaW5nIGNvbXBvbmVudC5yZW5kZXIgbWV0aG9kXHJcbiAqL1xudmFyIHJlZnMgPSBudWxsO1xuXG5mdW5jdGlvbiBjcmVhdGVWbm9kZSh2dHlwZSwgdHlwZSwgcHJvcHMsIGtleSwgcmVmKSB7XG4gICAgdmFyIHZub2RlID0ge1xuICAgICAgICB2dHlwZTogdnR5cGUsXG4gICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgIHByb3BzOiBwcm9wcyxcbiAgICAgICAgcmVmczogcmVmcyxcbiAgICAgICAga2V5OiBrZXksXG4gICAgICAgIHJlZjogcmVmXG4gICAgfTtcbiAgICBpZiAodnR5cGUgPT09IFZTVEFURUxFU1MgfHwgdnR5cGUgPT09IFZDT01QT05FTlQpIHtcbiAgICAgICAgdm5vZGUudWlkID0gZ2V0VWlkKCk7XG4gICAgfVxuICAgIHJldHVybiB2bm9kZTtcbn1cblxuZnVuY3Rpb24gaW5pdFZub2RlKHZub2RlLCBwYXJlbnRDb250ZXh0LCBuYW1lc3BhY2VVUkkpIHtcbiAgICB2YXIgdnR5cGUgPSB2bm9kZS52dHlwZTtcblxuICAgIHZhciBub2RlID0gbnVsbDtcbiAgICBpZiAoIXZ0eXBlKSB7XG4gICAgICAgIC8vIGluaXQgdGV4dFxuICAgICAgICBub2RlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodm5vZGUpO1xuICAgIH0gZWxzZSBpZiAodnR5cGUgPT09IFZFTEVNRU5UKSB7XG4gICAgICAgIC8vIGluaXQgZWxlbWVudFxuICAgICAgICBub2RlID0gaW5pdFZlbGVtKHZub2RlLCBwYXJlbnRDb250ZXh0LCBuYW1lc3BhY2VVUkkpO1xuICAgIH0gZWxzZSBpZiAodnR5cGUgPT09IFZDT01QT05FTlQpIHtcbiAgICAgICAgLy8gaW5pdCBzdGF0ZWZ1bCBjb21wb25lbnRcbiAgICAgICAgbm9kZSA9IGluaXRWY29tcG9uZW50KHZub2RlLCBwYXJlbnRDb250ZXh0LCBuYW1lc3BhY2VVUkkpO1xuICAgIH0gZWxzZSBpZiAodnR5cGUgPT09IFZTVEFURUxFU1MpIHtcbiAgICAgICAgLy8gaW5pdCBzdGF0ZWxlc3MgY29tcG9uZW50XG4gICAgICAgIG5vZGUgPSBpbml0VnN0YXRlbGVzcyh2bm9kZSwgcGFyZW50Q29udGV4dCwgbmFtZXNwYWNlVVJJKTtcbiAgICB9IGVsc2UgaWYgKHZ0eXBlID09PSBWQ09NTUVOVCkge1xuICAgICAgICAvLyBpbml0IGNvbW1lbnRcbiAgICAgICAgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZUNvbW1lbnQoJ3JlYWN0LXRleHQ6ICcgKyAodm5vZGUudWlkIHx8IGdldFVpZCgpKSk7XG4gICAgfVxuICAgIHJldHVybiBub2RlO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVWbm9kZSh2bm9kZSwgbmV3Vm5vZGUsIG5vZGUsIHBhcmVudENvbnRleHQpIHtcbiAgICB2YXIgdnR5cGUgPSB2bm9kZS52dHlwZTtcblxuICAgIGlmICh2dHlwZSA9PT0gVkNPTVBPTkVOVCkge1xuICAgICAgICByZXR1cm4gdXBkYXRlVmNvbXBvbmVudCh2bm9kZSwgbmV3Vm5vZGUsIG5vZGUsIHBhcmVudENvbnRleHQpO1xuICAgIH1cblxuICAgIGlmICh2dHlwZSA9PT0gVlNUQVRFTEVTUykge1xuICAgICAgICByZXR1cm4gdXBkYXRlVnN0YXRlbGVzcyh2bm9kZSwgbmV3Vm5vZGUsIG5vZGUsIHBhcmVudENvbnRleHQpO1xuICAgIH1cblxuICAgIC8vIGlnbm9yZSBWQ09NTUVOVCBhbmQgb3RoZXIgdnR5cGVzXG4gICAgaWYgKHZ0eXBlICE9PSBWRUxFTUVOVCkge1xuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICB9XG5cbiAgICB2YXIgb2xkSHRtbCA9IHZub2RlLnByb3BzW0hUTUxfS0VZXSAmJiB2bm9kZS5wcm9wc1tIVE1MX0tFWV0uX19odG1sO1xuICAgIGlmIChvbGRIdG1sICE9IG51bGwpIHtcbiAgICAgICAgdXBkYXRlVmVsZW0odm5vZGUsIG5ld1Zub2RlLCBub2RlLCBwYXJlbnRDb250ZXh0KTtcbiAgICAgICAgaW5pdFZjaGlsZHJlbihuZXdWbm9kZSwgbm9kZSwgcGFyZW50Q29udGV4dCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdXBkYXRlVkNoaWxkcmVuKHZub2RlLCBuZXdWbm9kZSwgbm9kZSwgcGFyZW50Q29udGV4dCk7XG4gICAgICAgIHVwZGF0ZVZlbGVtKHZub2RlLCBuZXdWbm9kZSwgbm9kZSwgcGFyZW50Q29udGV4dCk7XG4gICAgfVxuICAgIHJldHVybiBub2RlO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVWQ2hpbGRyZW4odm5vZGUsIG5ld1Zub2RlLCBub2RlLCBwYXJlbnRDb250ZXh0KSB7XG4gICAgdmFyIHBhdGNoZXMgPSB7XG4gICAgICAgIHJlbW92ZXM6IFtdLFxuICAgICAgICB1cGRhdGVzOiBbXSxcbiAgICAgICAgY3JlYXRlczogW11cbiAgICB9O1xuICAgIGRpZmZWY2hpbGRyZW4ocGF0Y2hlcywgdm5vZGUsIG5ld1Zub2RlLCBub2RlLCBwYXJlbnRDb250ZXh0KTtcbiAgICBmbGF0RWFjaChwYXRjaGVzLnJlbW92ZXMsIGFwcGx5RGVzdHJveSk7XG4gICAgZmxhdEVhY2gocGF0Y2hlcy51cGRhdGVzLCBhcHBseVVwZGF0ZSk7XG4gICAgZmxhdEVhY2gocGF0Y2hlcy5jcmVhdGVzLCBhcHBseUNyZWF0ZSk7XG59XG5cbmZ1bmN0aW9uIGFwcGx5VXBkYXRlKGRhdGEpIHtcbiAgICBpZiAoIWRhdGEpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdm5vZGUgPSBkYXRhLnZub2RlO1xuICAgIHZhciBuZXdOb2RlID0gZGF0YS5ub2RlO1xuXG4gICAgLy8gdXBkYXRlXG4gICAgaWYgKCFkYXRhLnNob3VsZElnbm9yZSkge1xuICAgICAgICBpZiAoIXZub2RlLnZ0eXBlKSB7XG4gICAgICAgICAgICBuZXdOb2RlLnJlcGxhY2VEYXRhKDAsIG5ld05vZGUubGVuZ3RoLCBkYXRhLm5ld1Zub2RlKTtcbiAgICAgICAgfSBlbHNlIGlmICh2bm9kZS52dHlwZSA9PT0gVkVMRU1FTlQpIHtcbiAgICAgICAgICAgIHVwZGF0ZVZlbGVtKHZub2RlLCBkYXRhLm5ld1Zub2RlLCBuZXdOb2RlLCBkYXRhLnBhcmVudENvbnRleHQpO1xuICAgICAgICB9IGVsc2UgaWYgKHZub2RlLnZ0eXBlID09PSBWU1RBVEVMRVNTKSB7XG4gICAgICAgICAgICBuZXdOb2RlID0gdXBkYXRlVnN0YXRlbGVzcyh2bm9kZSwgZGF0YS5uZXdWbm9kZSwgbmV3Tm9kZSwgZGF0YS5wYXJlbnRDb250ZXh0KTtcbiAgICAgICAgfSBlbHNlIGlmICh2bm9kZS52dHlwZSA9PT0gVkNPTVBPTkVOVCkge1xuICAgICAgICAgICAgbmV3Tm9kZSA9IHVwZGF0ZVZjb21wb25lbnQodm5vZGUsIGRhdGEubmV3Vm5vZGUsIG5ld05vZGUsIGRhdGEucGFyZW50Q29udGV4dCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyByZS1vcmRlclxuICAgIHZhciBjdXJyZW50Tm9kZSA9IG5ld05vZGUucGFyZW50Tm9kZS5jaGlsZE5vZGVzW2RhdGEuaW5kZXhdO1xuICAgIGlmIChjdXJyZW50Tm9kZSAhPT0gbmV3Tm9kZSkge1xuICAgICAgICBuZXdOb2RlLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKG5ld05vZGUsIGN1cnJlbnROb2RlKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ld05vZGU7XG59XG5cbmZ1bmN0aW9uIGFwcGx5RGVzdHJveShkYXRhKSB7XG4gICAgZGVzdHJveVZub2RlKGRhdGEudm5vZGUsIGRhdGEubm9kZSk7XG4gICAgZGF0YS5ub2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZGF0YS5ub2RlKTtcbn1cblxuZnVuY3Rpb24gYXBwbHlDcmVhdGUoZGF0YSkge1xuICAgIHZhciBub2RlID0gaW5pdFZub2RlKGRhdGEudm5vZGUsIGRhdGEucGFyZW50Q29udGV4dCwgZGF0YS5wYXJlbnROb2RlLm5hbWVzcGFjZVVSSSk7XG4gICAgZGF0YS5wYXJlbnROb2RlLmluc2VydEJlZm9yZShub2RlLCBkYXRhLnBhcmVudE5vZGUuY2hpbGROb2Rlc1tkYXRhLmluZGV4XSk7XG59XG5cbi8qKlxyXG4gKiBPbmx5IHZub2RlIHdoaWNoIGhhcyBwcm9wcy5jaGlsZHJlbiBuZWVkIHRvIGNhbGwgZGVzdHJveSBmdW5jdGlvblxyXG4gKiB0byBjaGVjayB3aGV0aGVyIHN1YlRyZWUgaGFzIGNvbXBvbmVudCB0aGF0IG5lZWQgdG8gY2FsbCBsaWZ5LWN5Y2xlIG1ldGhvZCBhbmQgcmVsZWFzZSBjYWNoZS5cclxuICovXG5cbmZ1bmN0aW9uIGRlc3Ryb3lWbm9kZSh2bm9kZSwgbm9kZSkge1xuICAgIHZhciB2dHlwZSA9IHZub2RlLnZ0eXBlO1xuXG4gICAgaWYgKHZ0eXBlID09PSBWRUxFTUVOVCkge1xuICAgICAgICAvLyBkZXN0cm95IGVsZW1lbnRcbiAgICAgICAgZGVzdHJveVZlbGVtKHZub2RlLCBub2RlKTtcbiAgICB9IGVsc2UgaWYgKHZ0eXBlID09PSBWQ09NUE9ORU5UKSB7XG4gICAgICAgIC8vIGRlc3Ryb3kgc3RhdGUgY29tcG9uZW50XG4gICAgICAgIGRlc3Ryb3lWY29tcG9uZW50KHZub2RlLCBub2RlKTtcbiAgICB9IGVsc2UgaWYgKHZ0eXBlID09PSBWU1RBVEVMRVNTKSB7XG4gICAgICAgIC8vIGRlc3Ryb3kgc3RhdGVsZXNzIGNvbXBvbmVudFxuICAgICAgICBkZXN0cm95VnN0YXRlbGVzcyh2bm9kZSwgbm9kZSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpbml0VmVsZW0odmVsZW0sIHBhcmVudENvbnRleHQsIG5hbWVzcGFjZVVSSSkge1xuICAgIHZhciB0eXBlID0gdmVsZW0udHlwZTtcbiAgICB2YXIgcHJvcHMgPSB2ZWxlbS5wcm9wcztcblxuICAgIHZhciBub2RlID0gbnVsbDtcblxuICAgIGlmICh0eXBlID09PSAnc3ZnJyB8fCBuYW1lc3BhY2VVUkkgPT09IFNWR05hbWVzcGFjZVVSSSkge1xuICAgICAgICBub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFNWR05hbWVzcGFjZVVSSSwgdHlwZSk7XG4gICAgICAgIG5hbWVzcGFjZVVSSSA9IFNWR05hbWVzcGFjZVVSSTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0eXBlKTtcbiAgICB9XG5cbiAgICBpbml0VmNoaWxkcmVuKHZlbGVtLCBub2RlLCBwYXJlbnRDb250ZXh0KTtcblxuICAgIHZhciBpc0N1c3RvbUNvbXBvbmVudCA9IHR5cGUuaW5kZXhPZignLScpID49IDAgfHwgcHJvcHMuaXMgIT0gbnVsbDtcbiAgICBzZXRQcm9wcyhub2RlLCBwcm9wcywgaXNDdXN0b21Db21wb25lbnQpO1xuXG4gICAgaWYgKHZlbGVtLnJlZiAhPSBudWxsKSB7XG4gICAgICAgIGFkZEl0ZW0ocGVuZGluZ1JlZnMsIHZlbGVtKTtcbiAgICAgICAgYWRkSXRlbShwZW5kaW5nUmVmcywgbm9kZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5vZGU7XG59XG5cbmZ1bmN0aW9uIGluaXRWY2hpbGRyZW4odmVsZW0sIG5vZGUsIHBhcmVudENvbnRleHQpIHtcbiAgICB2YXIgdmNoaWxkcmVuID0gbm9kZS52Y2hpbGRyZW4gPSBnZXRGbGF0dGVuQ2hpbGRyZW4odmVsZW0pO1xuICAgIHZhciBuYW1lc3BhY2VVUkkgPSBub2RlLm5hbWVzcGFjZVVSSTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdmNoaWxkcmVuLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIG5vZGUuYXBwZW5kQ2hpbGQoaW5pdFZub2RlKHZjaGlsZHJlbltpXSwgcGFyZW50Q29udGV4dCwgbmFtZXNwYWNlVVJJKSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRGbGF0dGVuQ2hpbGRyZW4odm5vZGUpIHtcbiAgICB2YXIgY2hpbGRyZW4gPSB2bm9kZS5wcm9wcy5jaGlsZHJlbjtcblxuICAgIHZhciB2Y2hpbGRyZW4gPSBbXTtcbiAgICBpZiAoaXNBcnIoY2hpbGRyZW4pKSB7XG4gICAgICAgIGZsYXRFYWNoKGNoaWxkcmVuLCBjb2xsZWN0Q2hpbGQsIHZjaGlsZHJlbik7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29sbGVjdENoaWxkKGNoaWxkcmVuLCB2Y2hpbGRyZW4pO1xuICAgIH1cbiAgICByZXR1cm4gdmNoaWxkcmVuO1xufVxuXG5mdW5jdGlvbiBjb2xsZWN0Q2hpbGQoY2hpbGQsIGNoaWxkcmVuKSB7XG4gICAgaWYgKGNoaWxkICE9IG51bGwgJiYgdHlwZW9mIGNoaWxkICE9PSAnYm9vbGVhbicpIHtcbiAgICAgICAgaWYgKCFjaGlsZC52dHlwZSkge1xuICAgICAgICAgICAgLy8gY29udmVydCBpbW11dGFibGVqcyBkYXRhXG4gICAgICAgICAgICBpZiAoY2hpbGQudG9KUykge1xuICAgICAgICAgICAgICAgIGNoaWxkID0gY2hpbGQudG9KUygpO1xuICAgICAgICAgICAgICAgIGlmIChpc0FycihjaGlsZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgZmxhdEVhY2goY2hpbGQsIGNvbGxlY3RDaGlsZCwgY2hpbGRyZW4pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbGxlY3RDaGlsZChjaGlsZCwgY2hpbGRyZW4pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjaGlsZCA9ICcnICsgY2hpbGQ7XG4gICAgICAgIH1cbiAgICAgICAgY2hpbGRyZW5bY2hpbGRyZW4ubGVuZ3RoXSA9IGNoaWxkO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZGlmZlZjaGlsZHJlbihwYXRjaGVzLCB2bm9kZSwgbmV3Vm5vZGUsIG5vZGUsIHBhcmVudENvbnRleHQpIHtcbiAgICB2YXIgY2hpbGROb2RlcyA9IG5vZGUuY2hpbGROb2RlcztcbiAgICB2YXIgdmNoaWxkcmVuID0gbm9kZS52Y2hpbGRyZW47XG5cbiAgICB2YXIgbmV3VmNoaWxkcmVuID0gbm9kZS52Y2hpbGRyZW4gPSBnZXRGbGF0dGVuQ2hpbGRyZW4obmV3Vm5vZGUpO1xuICAgIHZhciB2Y2hpbGRyZW5MZW4gPSB2Y2hpbGRyZW4ubGVuZ3RoO1xuICAgIHZhciBuZXdWY2hpbGRyZW5MZW4gPSBuZXdWY2hpbGRyZW4ubGVuZ3RoO1xuXG4gICAgaWYgKHZjaGlsZHJlbkxlbiA9PT0gMCkge1xuICAgICAgICBpZiAobmV3VmNoaWxkcmVuTGVuID4gMCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuZXdWY2hpbGRyZW5MZW47IGkrKykge1xuICAgICAgICAgICAgICAgIGFkZEl0ZW0ocGF0Y2hlcy5jcmVhdGVzLCB7XG4gICAgICAgICAgICAgICAgICAgIHZub2RlOiBuZXdWY2hpbGRyZW5baV0sXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudE5vZGU6IG5vZGUsXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudENvbnRleHQ6IHBhcmVudENvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgIGluZGV4OiBpXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZiAobmV3VmNoaWxkcmVuTGVuID09PSAwKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmNoaWxkcmVuTGVuOyBpKyspIHtcbiAgICAgICAgICAgIGFkZEl0ZW0ocGF0Y2hlcy5yZW1vdmVzLCB7XG4gICAgICAgICAgICAgICAgdm5vZGU6IHZjaGlsZHJlbltpXSxcbiAgICAgICAgICAgICAgICBub2RlOiBjaGlsZE5vZGVzW2ldXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIHVwZGF0ZXMgPSBBcnJheShuZXdWY2hpbGRyZW5MZW4pO1xuICAgIHZhciByZW1vdmVzID0gbnVsbDtcbiAgICB2YXIgY3JlYXRlcyA9IG51bGw7XG5cbiAgICAvLyBpc0VxdWFsXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2Y2hpbGRyZW5MZW47IGkrKykge1xuICAgICAgICB2YXIgX3Zub2RlID0gdmNoaWxkcmVuW2ldO1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IG5ld1ZjaGlsZHJlbkxlbjsgaisrKSB7XG4gICAgICAgICAgICBpZiAodXBkYXRlc1tqXSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIF9uZXdWbm9kZSA9IG5ld1ZjaGlsZHJlbltqXTtcbiAgICAgICAgICAgIGlmIChfdm5vZGUgPT09IF9uZXdWbm9kZSkge1xuICAgICAgICAgICAgICAgIHZhciBzaG91bGRJZ25vcmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGlmIChwYXJlbnRDb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChfdm5vZGUudnR5cGUgPT09IFZDT01QT05FTlQgfHwgX3Zub2RlLnZ0eXBlID09PSBWU1RBVEVMRVNTKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoX3Zub2RlLnR5cGUuY29udGV4dFR5cGVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvdWxkSWdub3JlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdXBkYXRlc1tqXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgc2hvdWxkSWdub3JlOiBzaG91bGRJZ25vcmUsXG4gICAgICAgICAgICAgICAgICAgIHZub2RlOiBfdm5vZGUsXG4gICAgICAgICAgICAgICAgICAgIG5ld1Zub2RlOiBfbmV3Vm5vZGUsXG4gICAgICAgICAgICAgICAgICAgIG5vZGU6IGNoaWxkTm9kZXNbaV0sXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudENvbnRleHQ6IHBhcmVudENvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgIGluZGV4OiBqXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB2Y2hpbGRyZW5baV0gPSBudWxsO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gaXNTaW1pbGFyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2Y2hpbGRyZW5MZW47IGkrKykge1xuICAgICAgICB2YXIgX3Zub2RlMiA9IHZjaGlsZHJlbltpXTtcbiAgICAgICAgaWYgKF92bm9kZTIgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzaG91bGRSZW1vdmUgPSB0cnVlO1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IG5ld1ZjaGlsZHJlbkxlbjsgaisrKSB7XG4gICAgICAgICAgICBpZiAodXBkYXRlc1tqXSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIF9uZXdWbm9kZTIgPSBuZXdWY2hpbGRyZW5bal07XG4gICAgICAgICAgICBpZiAoX25ld1Zub2RlMi50eXBlID09PSBfdm5vZGUyLnR5cGUgJiYgX25ld1Zub2RlMi5rZXkgPT09IF92bm9kZTIua2V5ICYmIF9uZXdWbm9kZTIucmVmcyA9PT0gX3Zub2RlMi5yZWZzKSB7XG4gICAgICAgICAgICAgICAgdXBkYXRlc1tqXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgdm5vZGU6IF92bm9kZTIsXG4gICAgICAgICAgICAgICAgICAgIG5ld1Zub2RlOiBfbmV3Vm5vZGUyLFxuICAgICAgICAgICAgICAgICAgICBub2RlOiBjaGlsZE5vZGVzW2ldLFxuICAgICAgICAgICAgICAgICAgICBwYXJlbnRDb250ZXh0OiBwYXJlbnRDb250ZXh0LFxuICAgICAgICAgICAgICAgICAgICBpbmRleDogalxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgc2hvdWxkUmVtb3ZlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNob3VsZFJlbW92ZSkge1xuICAgICAgICAgICAgaWYgKCFyZW1vdmVzKSB7XG4gICAgICAgICAgICAgICAgcmVtb3ZlcyA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYWRkSXRlbShyZW1vdmVzLCB7XG4gICAgICAgICAgICAgICAgdm5vZGU6IF92bm9kZTIsXG4gICAgICAgICAgICAgICAgbm9kZTogY2hpbGROb2Rlc1tpXVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5ld1ZjaGlsZHJlbkxlbjsgaSsrKSB7XG4gICAgICAgIHZhciBpdGVtID0gdXBkYXRlc1tpXTtcbiAgICAgICAgaWYgKCFpdGVtKSB7XG4gICAgICAgICAgICBpZiAoIWNyZWF0ZXMpIHtcbiAgICAgICAgICAgICAgICBjcmVhdGVzID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhZGRJdGVtKGNyZWF0ZXMsIHtcbiAgICAgICAgICAgICAgICB2bm9kZTogbmV3VmNoaWxkcmVuW2ldLFxuICAgICAgICAgICAgICAgIHBhcmVudE5vZGU6IG5vZGUsXG4gICAgICAgICAgICAgICAgcGFyZW50Q29udGV4dDogcGFyZW50Q29udGV4dCxcbiAgICAgICAgICAgICAgICBpbmRleDogaVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXRlbS52bm9kZS52dHlwZSA9PT0gVkVMRU1FTlQpIHtcbiAgICAgICAgICAgIGRpZmZWY2hpbGRyZW4ocGF0Y2hlcywgaXRlbS52bm9kZSwgaXRlbS5uZXdWbm9kZSwgaXRlbS5ub2RlLCBpdGVtLnBhcmVudENvbnRleHQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHJlbW92ZXMpIHtcbiAgICAgICAgYWRkSXRlbShwYXRjaGVzLnJlbW92ZXMsIHJlbW92ZXMpO1xuICAgIH1cbiAgICBpZiAoY3JlYXRlcykge1xuICAgICAgICBhZGRJdGVtKHBhdGNoZXMuY3JlYXRlcywgY3JlYXRlcyk7XG4gICAgfVxuICAgIGFkZEl0ZW0ocGF0Y2hlcy51cGRhdGVzLCB1cGRhdGVzKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlVmVsZW0odmVsZW0sIG5ld1ZlbGVtLCBub2RlKSB7XG4gICAgdmFyIGlzQ3VzdG9tQ29tcG9uZW50ID0gdmVsZW0udHlwZS5pbmRleE9mKCctJykgPj0gMCB8fCB2ZWxlbS5wcm9wcy5pcyAhPSBudWxsO1xuICAgIHBhdGNoUHJvcHMobm9kZSwgdmVsZW0ucHJvcHMsIG5ld1ZlbGVtLnByb3BzLCBpc0N1c3RvbUNvbXBvbmVudCk7XG4gICAgaWYgKHZlbGVtLnJlZiAhPT0gbmV3VmVsZW0ucmVmKSB7XG4gICAgICAgIGRldGFjaFJlZih2ZWxlbS5yZWZzLCB2ZWxlbS5yZWYsIG5vZGUpO1xuICAgICAgICBhdHRhY2hSZWYobmV3VmVsZW0ucmVmcywgbmV3VmVsZW0ucmVmLCBub2RlKTtcbiAgICB9XG4gICAgcmV0dXJuIG5vZGU7XG59XG5cbmZ1bmN0aW9uIGRlc3Ryb3lWZWxlbSh2ZWxlbSwgbm9kZSkge1xuICAgIHZhciBwcm9wcyA9IHZlbGVtLnByb3BzO1xuICAgIHZhciB2Y2hpbGRyZW4gPSBub2RlLnZjaGlsZHJlbjtcbiAgICB2YXIgY2hpbGROb2RlcyA9IG5vZGUuY2hpbGROb2RlcztcblxuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB2Y2hpbGRyZW4ubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgZGVzdHJveVZub2RlKHZjaGlsZHJlbltpXSwgY2hpbGROb2Rlc1tpXSk7XG4gICAgfVxuICAgIGRldGFjaFJlZih2ZWxlbS5yZWZzLCB2ZWxlbS5yZWYsIG5vZGUpO1xuICAgIG5vZGUuZXZlbnRTdG9yZSA9IG5vZGUudmNoaWxkcmVuID0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaW5pdFZzdGF0ZWxlc3ModnN0YXRlbGVzcywgcGFyZW50Q29udGV4dCwgbmFtZXNwYWNlVVJJKSB7XG4gICAgdmFyIHZub2RlID0gcmVuZGVyVnN0YXRlbGVzcyh2c3RhdGVsZXNzLCBwYXJlbnRDb250ZXh0KTtcbiAgICB2YXIgbm9kZSA9IGluaXRWbm9kZSh2bm9kZSwgcGFyZW50Q29udGV4dCwgbmFtZXNwYWNlVVJJKTtcbiAgICBub2RlLmNhY2hlID0gbm9kZS5jYWNoZSB8fCB7fTtcbiAgICBub2RlLmNhY2hlW3ZzdGF0ZWxlc3MudWlkXSA9IHZub2RlO1xuICAgIHJldHVybiBub2RlO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVWc3RhdGVsZXNzKHZzdGF0ZWxlc3MsIG5ld1ZzdGF0ZWxlc3MsIG5vZGUsIHBhcmVudENvbnRleHQpIHtcbiAgICB2YXIgdWlkID0gdnN0YXRlbGVzcy51aWQ7XG4gICAgdmFyIHZub2RlID0gbm9kZS5jYWNoZVt1aWRdO1xuICAgIGRlbGV0ZSBub2RlLmNhY2hlW3VpZF07XG4gICAgdmFyIG5ld1Zub2RlID0gcmVuZGVyVnN0YXRlbGVzcyhuZXdWc3RhdGVsZXNzLCBwYXJlbnRDb250ZXh0KTtcbiAgICB2YXIgbmV3Tm9kZSA9IGNvbXBhcmVUd29Wbm9kZXModm5vZGUsIG5ld1Zub2RlLCBub2RlLCBwYXJlbnRDb250ZXh0KTtcbiAgICBuZXdOb2RlLmNhY2hlID0gbmV3Tm9kZS5jYWNoZSB8fCB7fTtcbiAgICBuZXdOb2RlLmNhY2hlW25ld1ZzdGF0ZWxlc3MudWlkXSA9IG5ld1Zub2RlO1xuICAgIGlmIChuZXdOb2RlICE9PSBub2RlKSB7XG4gICAgICAgIHN5bmNDYWNoZShuZXdOb2RlLmNhY2hlLCBub2RlLmNhY2hlLCBuZXdOb2RlKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ld05vZGU7XG59XG5cbmZ1bmN0aW9uIGRlc3Ryb3lWc3RhdGVsZXNzKHZzdGF0ZWxlc3MsIG5vZGUpIHtcbiAgICB2YXIgdWlkID0gdnN0YXRlbGVzcy51aWQ7XG4gICAgdmFyIHZub2RlID0gbm9kZS5jYWNoZVt1aWRdO1xuICAgIGRlbGV0ZSBub2RlLmNhY2hlW3VpZF07XG4gICAgZGVzdHJveVZub2RlKHZub2RlLCBub2RlKTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyVnN0YXRlbGVzcyh2c3RhdGVsZXNzLCBwYXJlbnRDb250ZXh0KSB7XG4gICAgdmFyIGZhY3RvcnkgPSB2c3RhdGVsZXNzLnR5cGU7XG4gICAgdmFyIHByb3BzID0gdnN0YXRlbGVzcy5wcm9wcztcblxuICAgIHZhciBjb21wb25lbnRDb250ZXh0ID0gZ2V0Q29udGV4dEJ5VHlwZXMocGFyZW50Q29udGV4dCwgZmFjdG9yeS5jb250ZXh0VHlwZXMpO1xuICAgIHZhciB2bm9kZSA9IGZhY3RvcnkocHJvcHMsIGNvbXBvbmVudENvbnRleHQpO1xuICAgIGlmICh2bm9kZSAmJiB2bm9kZS5yZW5kZXIpIHtcbiAgICAgICAgdm5vZGUgPSB2bm9kZS5yZW5kZXIoKTtcbiAgICB9XG4gICAgaWYgKHZub2RlID09PSBudWxsIHx8IHZub2RlID09PSBmYWxzZSkge1xuICAgICAgICB2bm9kZSA9IGNyZWF0ZVZub2RlKFZDT01NRU5UKTtcbiAgICB9IGVsc2UgaWYgKCF2bm9kZSB8fCAhdm5vZGUudnR5cGUpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdAJyArIGZhY3RvcnkubmFtZSArICcjcmVuZGVyOllvdSBtYXkgaGF2ZSByZXR1cm5lZCB1bmRlZmluZWQsIGFuIGFycmF5IG9yIHNvbWUgb3RoZXIgaW52YWxpZCBvYmplY3QnKTtcbiAgICB9XG4gICAgcmV0dXJuIHZub2RlO1xufVxuXG5mdW5jdGlvbiBpbml0VmNvbXBvbmVudCh2Y29tcG9uZW50LCBwYXJlbnRDb250ZXh0LCBuYW1lc3BhY2VVUkkpIHtcbiAgICB2YXIgQ29tcG9uZW50ID0gdmNvbXBvbmVudC50eXBlO1xuICAgIHZhciBwcm9wcyA9IHZjb21wb25lbnQucHJvcHM7XG4gICAgdmFyIHVpZCA9IHZjb21wb25lbnQudWlkO1xuXG4gICAgdmFyIGNvbXBvbmVudENvbnRleHQgPSBnZXRDb250ZXh0QnlUeXBlcyhwYXJlbnRDb250ZXh0LCBDb21wb25lbnQuY29udGV4dFR5cGVzKTtcbiAgICB2YXIgY29tcG9uZW50ID0gbmV3IENvbXBvbmVudChwcm9wcywgY29tcG9uZW50Q29udGV4dCk7XG4gICAgdmFyIHVwZGF0ZXIgPSBjb21wb25lbnQuJHVwZGF0ZXI7XG4gICAgdmFyIGNhY2hlID0gY29tcG9uZW50LiRjYWNoZTtcblxuICAgIGNhY2hlLnBhcmVudENvbnRleHQgPSBwYXJlbnRDb250ZXh0O1xuICAgIHVwZGF0ZXIuaXNQZW5kaW5nID0gdHJ1ZTtcbiAgICBjb21wb25lbnQucHJvcHMgPSBjb21wb25lbnQucHJvcHMgfHwgcHJvcHM7XG4gICAgY29tcG9uZW50LmNvbnRleHQgPSBjb21wb25lbnQuY29udGV4dCB8fCBjb21wb25lbnRDb250ZXh0O1xuICAgIGlmIChjb21wb25lbnQuY29tcG9uZW50V2lsbE1vdW50KSB7XG4gICAgICAgIGNvbXBvbmVudC5jb21wb25lbnRXaWxsTW91bnQoKTtcbiAgICAgICAgY29tcG9uZW50LnN0YXRlID0gdXBkYXRlci5nZXRTdGF0ZSgpO1xuICAgIH1cbiAgICB2YXIgdm5vZGUgPSByZW5kZXJDb21wb25lbnQoY29tcG9uZW50KTtcbiAgICB2YXIgbm9kZSA9IGluaXRWbm9kZSh2bm9kZSwgZ2V0Q2hpbGRDb250ZXh0KGNvbXBvbmVudCwgcGFyZW50Q29udGV4dCksIG5hbWVzcGFjZVVSSSk7XG4gICAgbm9kZS5jYWNoZSA9IG5vZGUuY2FjaGUgfHwge307XG4gICAgbm9kZS5jYWNoZVt1aWRdID0gY29tcG9uZW50O1xuICAgIGNhY2hlLnZub2RlID0gdm5vZGU7XG4gICAgY2FjaGUubm9kZSA9IG5vZGU7XG4gICAgY2FjaGUuaXNNb3VudGVkID0gdHJ1ZTtcbiAgICBhZGRJdGVtKHBlbmRpbmdDb21wb25lbnRzLCBjb21wb25lbnQpO1xuXG4gICAgaWYgKHZjb21wb25lbnQucmVmICE9IG51bGwpIHtcbiAgICAgICAgYWRkSXRlbShwZW5kaW5nUmVmcywgdmNvbXBvbmVudCk7XG4gICAgICAgIGFkZEl0ZW0ocGVuZGluZ1JlZnMsIGNvbXBvbmVudCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5vZGU7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVZjb21wb25lbnQodmNvbXBvbmVudCwgbmV3VmNvbXBvbmVudCwgbm9kZSwgcGFyZW50Q29udGV4dCkge1xuICAgIHZhciB1aWQgPSB2Y29tcG9uZW50LnVpZDtcbiAgICB2YXIgY29tcG9uZW50ID0gbm9kZS5jYWNoZVt1aWRdO1xuICAgIHZhciB1cGRhdGVyID0gY29tcG9uZW50LiR1cGRhdGVyO1xuICAgIHZhciBjYWNoZSA9IGNvbXBvbmVudC4kY2FjaGU7XG4gICAgdmFyIENvbXBvbmVudCA9IG5ld1Zjb21wb25lbnQudHlwZTtcbiAgICB2YXIgbmV4dFByb3BzID0gbmV3VmNvbXBvbmVudC5wcm9wcztcblxuICAgIHZhciBjb21wb25lbnRDb250ZXh0ID0gZ2V0Q29udGV4dEJ5VHlwZXMocGFyZW50Q29udGV4dCwgQ29tcG9uZW50LmNvbnRleHRUeXBlcyk7XG4gICAgZGVsZXRlIG5vZGUuY2FjaGVbdWlkXTtcbiAgICBub2RlLmNhY2hlW25ld1Zjb21wb25lbnQudWlkXSA9IGNvbXBvbmVudDtcbiAgICBjYWNoZS5wYXJlbnRDb250ZXh0ID0gcGFyZW50Q29udGV4dDtcbiAgICBpZiAoY29tcG9uZW50LmNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMpIHtcbiAgICAgICAgdmFyIG5lZWRUb2dnbGVJc1BlbmRpbmcgPSAhdXBkYXRlci5pc1BlbmRpbmc7XG4gICAgICAgIGlmIChuZWVkVG9nZ2xlSXNQZW5kaW5nKSB1cGRhdGVyLmlzUGVuZGluZyA9IHRydWU7XG4gICAgICAgIGNvbXBvbmVudC5jb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzKG5leHRQcm9wcywgY29tcG9uZW50Q29udGV4dCk7XG4gICAgICAgIGlmIChuZWVkVG9nZ2xlSXNQZW5kaW5nKSB1cGRhdGVyLmlzUGVuZGluZyA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmICh2Y29tcG9uZW50LnJlZiAhPT0gbmV3VmNvbXBvbmVudC5yZWYpIHtcbiAgICAgICAgZGV0YWNoUmVmKHZjb21wb25lbnQucmVmcywgdmNvbXBvbmVudC5yZWYsIGNvbXBvbmVudCk7XG4gICAgICAgIGF0dGFjaFJlZihuZXdWY29tcG9uZW50LnJlZnMsIG5ld1Zjb21wb25lbnQucmVmLCBjb21wb25lbnQpO1xuICAgIH1cblxuICAgIHVwZGF0ZXIuZW1pdFVwZGF0ZShuZXh0UHJvcHMsIGNvbXBvbmVudENvbnRleHQpO1xuXG4gICAgcmV0dXJuIGNhY2hlLm5vZGU7XG59XG5cbmZ1bmN0aW9uIGRlc3Ryb3lWY29tcG9uZW50KHZjb21wb25lbnQsIG5vZGUpIHtcbiAgICB2YXIgdWlkID0gdmNvbXBvbmVudC51aWQ7XG4gICAgdmFyIGNvbXBvbmVudCA9IG5vZGUuY2FjaGVbdWlkXTtcbiAgICB2YXIgY2FjaGUgPSBjb21wb25lbnQuJGNhY2hlO1xuICAgIGRlbGV0ZSBub2RlLmNhY2hlW3VpZF07XG4gICAgZGV0YWNoUmVmKHZjb21wb25lbnQucmVmcywgdmNvbXBvbmVudC5yZWYsIGNvbXBvbmVudCk7XG4gICAgY29tcG9uZW50LnNldFN0YXRlID0gY29tcG9uZW50LmZvcmNlVXBkYXRlID0gbm9vcDtcbiAgICBpZiAoY29tcG9uZW50LmNvbXBvbmVudFdpbGxVbm1vdW50KSB7XG4gICAgICAgIGNvbXBvbmVudC5jb21wb25lbnRXaWxsVW5tb3VudCgpO1xuICAgIH1cbiAgICBkZXN0cm95Vm5vZGUoY2FjaGUudm5vZGUsIG5vZGUpO1xuICAgIGRlbGV0ZSBjb21wb25lbnQuc2V0U3RhdGU7XG4gICAgY2FjaGUuaXNNb3VudGVkID0gZmFsc2U7XG4gICAgY2FjaGUubm9kZSA9IGNhY2hlLnBhcmVudENvbnRleHQgPSBjYWNoZS52bm9kZSA9IGNvbXBvbmVudC5yZWZzID0gY29tcG9uZW50LmNvbnRleHQgPSBudWxsO1xufVxuXG5mdW5jdGlvbiBnZXRDb250ZXh0QnlUeXBlcyhjdXJDb250ZXh0LCBjb250ZXh0VHlwZXMpIHtcbiAgICB2YXIgY29udGV4dCA9IHt9O1xuICAgIGlmICghY29udGV4dFR5cGVzIHx8ICFjdXJDb250ZXh0KSB7XG4gICAgICAgIHJldHVybiBjb250ZXh0O1xuICAgIH1cbiAgICBmb3IgKHZhciBrZXkgaW4gY29udGV4dFR5cGVzKSB7XG4gICAgICAgIGlmIChjb250ZXh0VHlwZXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgY29udGV4dFtrZXldID0gY3VyQ29udGV4dFtrZXldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjb250ZXh0O1xufVxuXG5mdW5jdGlvbiByZW5kZXJDb21wb25lbnQoY29tcG9uZW50LCBwYXJlbnRDb250ZXh0KSB7XG4gICAgcmVmcyA9IGNvbXBvbmVudC5yZWZzO1xuICAgIHZhciB2bm9kZSA9IGNvbXBvbmVudC5yZW5kZXIoKTtcbiAgICBpZiAodm5vZGUgPT09IG51bGwgfHwgdm5vZGUgPT09IGZhbHNlKSB7XG4gICAgICAgIHZub2RlID0gY3JlYXRlVm5vZGUoVkNPTU1FTlQpO1xuICAgIH0gZWxzZSBpZiAoIXZub2RlIHx8ICF2bm9kZS52dHlwZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0AnICsgY29tcG9uZW50LmNvbnN0cnVjdG9yLm5hbWUgKyAnI3JlbmRlcjpZb3UgbWF5IGhhdmUgcmV0dXJuZWQgdW5kZWZpbmVkLCBhbiBhcnJheSBvciBzb21lIG90aGVyIGludmFsaWQgb2JqZWN0Jyk7XG4gICAgfVxuICAgIHJlZnMgPSBudWxsO1xuICAgIHJldHVybiB2bm9kZTtcbn1cblxuZnVuY3Rpb24gZ2V0Q2hpbGRDb250ZXh0KGNvbXBvbmVudCwgcGFyZW50Q29udGV4dCkge1xuICAgIGlmIChjb21wb25lbnQuZ2V0Q2hpbGRDb250ZXh0KSB7XG4gICAgICAgIHZhciBjdXJDb250ZXh0ID0gY29tcG9uZW50LmdldENoaWxkQ29udGV4dCgpO1xuICAgICAgICBpZiAoY3VyQ29udGV4dCkge1xuICAgICAgICAgICAgcGFyZW50Q29udGV4dCA9IGV4dGVuZChleHRlbmQoe30sIHBhcmVudENvbnRleHQpLCBjdXJDb250ZXh0KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcGFyZW50Q29udGV4dDtcbn1cblxudmFyIHBlbmRpbmdDb21wb25lbnRzID0gW107XG5mdW5jdGlvbiBjbGVhclBlbmRpbmdDb21wb25lbnRzKCkge1xuICAgIHZhciBsZW4gPSBwZW5kaW5nQ29tcG9uZW50cy5sZW5ndGg7XG4gICAgaWYgKCFsZW4pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgY29tcG9uZW50cyA9IHBlbmRpbmdDb21wb25lbnRzO1xuICAgIHBlbmRpbmdDb21wb25lbnRzID0gW107XG4gICAgdmFyIGkgPSAtMTtcbiAgICB3aGlsZSAobGVuLS0pIHtcbiAgICAgICAgdmFyIGNvbXBvbmVudCA9IGNvbXBvbmVudHNbKytpXTtcbiAgICAgICAgdmFyIHVwZGF0ZXIgPSBjb21wb25lbnQuJHVwZGF0ZXI7XG4gICAgICAgIGlmIChjb21wb25lbnQuY29tcG9uZW50RGlkTW91bnQpIHtcbiAgICAgICAgICAgIGNvbXBvbmVudC5jb21wb25lbnREaWRNb3VudCgpO1xuICAgICAgICB9XG4gICAgICAgIHVwZGF0ZXIuaXNQZW5kaW5nID0gZmFsc2U7XG4gICAgICAgIHVwZGF0ZXIuZW1pdFVwZGF0ZSgpO1xuICAgIH1cbn1cblxudmFyIHBlbmRpbmdSZWZzID0gW107XG5mdW5jdGlvbiBjbGVhclBlbmRpbmdSZWZzKCkge1xuICAgIHZhciBsZW4gPSBwZW5kaW5nUmVmcy5sZW5ndGg7XG4gICAgaWYgKCFsZW4pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgbGlzdCA9IHBlbmRpbmdSZWZzO1xuICAgIHBlbmRpbmdSZWZzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gMikge1xuICAgICAgICB2YXIgdm5vZGUgPSBsaXN0W2ldO1xuICAgICAgICB2YXIgcmVmVmFsdWUgPSBsaXN0W2kgKyAxXTtcbiAgICAgICAgYXR0YWNoUmVmKHZub2RlLnJlZnMsIHZub2RlLnJlZiwgcmVmVmFsdWUpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gY2xlYXJQZW5kaW5nKCkge1xuICAgIGNsZWFyUGVuZGluZ1JlZnMoKTtcbiAgICBjbGVhclBlbmRpbmdDb21wb25lbnRzKCk7XG59XG5cbmZ1bmN0aW9uIGNvbXBhcmVUd29Wbm9kZXModm5vZGUsIG5ld1Zub2RlLCBub2RlLCBwYXJlbnRDb250ZXh0KSB7XG4gICAgdmFyIG5ld05vZGUgPSBub2RlO1xuICAgIGlmIChuZXdWbm9kZSA9PSBudWxsKSB7XG4gICAgICAgIC8vIHJlbW92ZVxuICAgICAgICBkZXN0cm95Vm5vZGUodm5vZGUsIG5vZGUpO1xuICAgICAgICBub2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobm9kZSk7XG4gICAgfSBlbHNlIGlmICh2bm9kZS50eXBlICE9PSBuZXdWbm9kZS50eXBlIHx8IHZub2RlLmtleSAhPT0gbmV3Vm5vZGUua2V5KSB7XG4gICAgICAgIC8vIHJlcGxhY2VcbiAgICAgICAgZGVzdHJveVZub2RlKHZub2RlLCBub2RlKTtcbiAgICAgICAgbmV3Tm9kZSA9IGluaXRWbm9kZShuZXdWbm9kZSwgcGFyZW50Q29udGV4dCwgbm9kZS5uYW1lc3BhY2VVUkkpO1xuICAgICAgICBub2RlLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKG5ld05vZGUsIG5vZGUpO1xuICAgIH0gZWxzZSBpZiAodm5vZGUgIT09IG5ld1Zub2RlIHx8IHBhcmVudENvbnRleHQpIHtcbiAgICAgICAgLy8gc2FtZSB0eXBlIGFuZCBzYW1lIGtleSAtPiB1cGRhdGVcbiAgICAgICAgbmV3Tm9kZSA9IHVwZGF0ZVZub2RlKHZub2RlLCBuZXdWbm9kZSwgbm9kZSwgcGFyZW50Q29udGV4dCk7XG4gICAgfVxuICAgIHJldHVybiBuZXdOb2RlO1xufVxuXG5mdW5jdGlvbiBnZXRET01Ob2RlKCkge1xuICAgIHJldHVybiB0aGlzO1xufVxuXG5mdW5jdGlvbiBhdHRhY2hSZWYocmVmcywgcmVmS2V5LCByZWZWYWx1ZSkge1xuICAgIGlmIChyZWZLZXkgPT0gbnVsbCB8fCAhcmVmVmFsdWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAocmVmVmFsdWUubm9kZU5hbWUgJiYgIXJlZlZhbHVlLmdldERPTU5vZGUpIHtcbiAgICAgICAgLy8gc3VwcG9ydCByZWFjdCB2MC4xMyBzdHlsZTogdGhpcy5yZWZzLm15SW5wdXQuZ2V0RE9NTm9kZSgpXG4gICAgICAgIHJlZlZhbHVlLmdldERPTU5vZGUgPSBnZXRET01Ob2RlO1xuICAgIH1cbiAgICBpZiAoaXNGbihyZWZLZXkpKSB7XG4gICAgICAgIHJlZktleShyZWZWYWx1ZSk7XG4gICAgfSBlbHNlIGlmIChyZWZzKSB7XG4gICAgICAgIHJlZnNbcmVmS2V5XSA9IHJlZlZhbHVlO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZGV0YWNoUmVmKHJlZnMsIHJlZktleSwgcmVmVmFsdWUpIHtcbiAgICBpZiAocmVmS2V5ID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoaXNGbihyZWZLZXkpKSB7XG4gICAgICAgIHJlZktleShudWxsKTtcbiAgICB9IGVsc2UgaWYgKHJlZnMgJiYgcmVmc1tyZWZLZXldID09PSByZWZWYWx1ZSkge1xuICAgICAgICBkZWxldGUgcmVmc1tyZWZLZXldO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc3luY0NhY2hlKGNhY2hlLCBvbGRDYWNoZSwgbm9kZSkge1xuICAgIGZvciAodmFyIGtleSBpbiBvbGRDYWNoZSkge1xuICAgICAgICBpZiAoIW9sZENhY2hlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIHZhciB2YWx1ZSA9IG9sZENhY2hlW2tleV07XG4gICAgICAgIGNhY2hlW2tleV0gPSB2YWx1ZTtcblxuICAgICAgICAvLyBpcyBjb21wb25lbnQsIHVwZGF0ZSBjb21wb25lbnQuJGNhY2hlLm5vZGVcbiAgICAgICAgaWYgKHZhbHVlLmZvcmNlVXBkYXRlKSB7XG4gICAgICAgICAgICB2YWx1ZS4kY2FjaGUubm9kZSA9IG5vZGU7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbnZhciB1cGRhdGVRdWV1ZSA9IHtcblx0dXBkYXRlcnM6IFtdLFxuXHRpc1BlbmRpbmc6IGZhbHNlLFxuXHRhZGQ6IGZ1bmN0aW9uIGFkZCh1cGRhdGVyKSB7XG5cdFx0YWRkSXRlbSh0aGlzLnVwZGF0ZXJzLCB1cGRhdGVyKTtcblx0fSxcblx0YmF0Y2hVcGRhdGU6IGZ1bmN0aW9uIGJhdGNoVXBkYXRlKCkge1xuXHRcdGlmICh0aGlzLmlzUGVuZGluZykge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHR0aGlzLmlzUGVuZGluZyA9IHRydWU7XG5cdFx0LypcclxuICAgZWFjaCB1cGRhdGVyLnVwZGF0ZSBtYXkgYWRkIG5ldyB1cGRhdGVyIHRvIHVwZGF0ZVF1ZXVlXHJcbiAgIGNsZWFyIHRoZW0gd2l0aCBhIGxvb3BcclxuICAgZXZlbnQgYnViYmxlcyBmcm9tIGJvdHRvbS1sZXZlbCB0byB0b3AtbGV2ZWxcclxuICAgcmV2ZXJzZSB0aGUgdXBkYXRlciBvcmRlciBjYW4gbWVyZ2Ugc29tZSBwcm9wcyBhbmQgc3RhdGUgYW5kIHJlZHVjZSB0aGUgcmVmcmVzaCB0aW1lc1xyXG4gICBzZWUgVXBkYXRlci51cGRhdGUgbWV0aG9kIGJlbG93IHRvIGtub3cgd2h5XHJcbiAgKi9cblx0XHR2YXIgdXBkYXRlcnMgPSB0aGlzLnVwZGF0ZXJzO1xuXG5cdFx0dmFyIHVwZGF0ZXIgPSB1bmRlZmluZWQ7XG5cdFx0d2hpbGUgKHVwZGF0ZXIgPSB1cGRhdGVycy5wb3AoKSkge1xuXHRcdFx0dXBkYXRlci51cGRhdGVDb21wb25lbnQoKTtcblx0XHR9XG5cdFx0dGhpcy5pc1BlbmRpbmcgPSBmYWxzZTtcblx0fVxufTtcblxuZnVuY3Rpb24gVXBkYXRlcihpbnN0YW5jZSkge1xuXHR0aGlzLmluc3RhbmNlID0gaW5zdGFuY2U7XG5cdHRoaXMucGVuZGluZ1N0YXRlcyA9IFtdO1xuXHR0aGlzLnBlbmRpbmdDYWxsYmFja3MgPSBbXTtcblx0dGhpcy5pc1BlbmRpbmcgPSBmYWxzZTtcblx0dGhpcy5uZXh0UHJvcHMgPSB0aGlzLm5leHRDb250ZXh0ID0gbnVsbDtcblx0dGhpcy5jbGVhckNhbGxiYWNrcyA9IHRoaXMuY2xlYXJDYWxsYmFja3MuYmluZCh0aGlzKTtcbn1cblxuVXBkYXRlci5wcm90b3R5cGUgPSB7XG5cdGVtaXRVcGRhdGU6IGZ1bmN0aW9uIGVtaXRVcGRhdGUobmV4dFByb3BzLCBuZXh0Q29udGV4dCkge1xuXHRcdHRoaXMubmV4dFByb3BzID0gbmV4dFByb3BzO1xuXHRcdHRoaXMubmV4dENvbnRleHQgPSBuZXh0Q29udGV4dDtcblx0XHQvLyByZWNlaXZlIG5leHRQcm9wcyEhIHNob3VsZCB1cGRhdGUgaW1tZWRpYXRlbHlcblx0XHRuZXh0UHJvcHMgfHwgIXVwZGF0ZVF1ZXVlLmlzUGVuZGluZyA/IHRoaXMudXBkYXRlQ29tcG9uZW50KCkgOiB1cGRhdGVRdWV1ZS5hZGQodGhpcyk7XG5cdH0sXG5cdHVwZGF0ZUNvbXBvbmVudDogZnVuY3Rpb24gdXBkYXRlQ29tcG9uZW50KCkge1xuXHRcdHZhciBpbnN0YW5jZSA9IHRoaXMuaW5zdGFuY2U7XG5cdFx0dmFyIHBlbmRpbmdTdGF0ZXMgPSB0aGlzLnBlbmRpbmdTdGF0ZXM7XG5cdFx0dmFyIG5leHRQcm9wcyA9IHRoaXMubmV4dFByb3BzO1xuXHRcdHZhciBuZXh0Q29udGV4dCA9IHRoaXMubmV4dENvbnRleHQ7XG5cblx0XHRpZiAobmV4dFByb3BzIHx8IHBlbmRpbmdTdGF0ZXMubGVuZ3RoID4gMCkge1xuXHRcdFx0bmV4dFByb3BzID0gbmV4dFByb3BzIHx8IGluc3RhbmNlLnByb3BzO1xuXHRcdFx0bmV4dENvbnRleHQgPSBuZXh0Q29udGV4dCB8fCBpbnN0YW5jZS5jb250ZXh0O1xuXHRcdFx0dGhpcy5uZXh0UHJvcHMgPSB0aGlzLm5leHRDb250ZXh0ID0gbnVsbDtcblx0XHRcdC8vIG1lcmdlIHRoZSBuZXh0UHJvcHMgYW5kIG5leHRTdGF0ZSBhbmQgdXBkYXRlIGJ5IG9uZSB0aW1lXG5cdFx0XHRzaG91bGRVcGRhdGUoaW5zdGFuY2UsIG5leHRQcm9wcywgdGhpcy5nZXRTdGF0ZSgpLCBuZXh0Q29udGV4dCwgdGhpcy5jbGVhckNhbGxiYWNrcyk7XG5cdFx0fVxuXHR9LFxuXHRhZGRTdGF0ZTogZnVuY3Rpb24gYWRkU3RhdGUobmV4dFN0YXRlKSB7XG5cdFx0aWYgKG5leHRTdGF0ZSkge1xuXHRcdFx0YWRkSXRlbSh0aGlzLnBlbmRpbmdTdGF0ZXMsIG5leHRTdGF0ZSk7XG5cdFx0XHRpZiAoIXRoaXMuaXNQZW5kaW5nKSB7XG5cdFx0XHRcdHRoaXMuZW1pdFVwZGF0ZSgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblx0cmVwbGFjZVN0YXRlOiBmdW5jdGlvbiByZXBsYWNlU3RhdGUobmV4dFN0YXRlKSB7XG5cdFx0dmFyIHBlbmRpbmdTdGF0ZXMgPSB0aGlzLnBlbmRpbmdTdGF0ZXM7XG5cblx0XHRwZW5kaW5nU3RhdGVzLnBvcCgpO1xuXHRcdC8vIHB1c2ggc3BlY2lhbCBwYXJhbXMgdG8gcG9pbnQgb3V0IHNob3VsZCByZXBsYWNlIHN0YXRlXG5cdFx0YWRkSXRlbShwZW5kaW5nU3RhdGVzLCBbbmV4dFN0YXRlXSk7XG5cdH0sXG5cdGdldFN0YXRlOiBmdW5jdGlvbiBnZXRTdGF0ZSgpIHtcblx0XHR2YXIgaW5zdGFuY2UgPSB0aGlzLmluc3RhbmNlO1xuXHRcdHZhciBwZW5kaW5nU3RhdGVzID0gdGhpcy5wZW5kaW5nU3RhdGVzO1xuXHRcdHZhciBzdGF0ZSA9IGluc3RhbmNlLnN0YXRlO1xuXHRcdHZhciBwcm9wcyA9IGluc3RhbmNlLnByb3BzO1xuXG5cdFx0aWYgKHBlbmRpbmdTdGF0ZXMubGVuZ3RoKSB7XG5cdFx0XHRzdGF0ZSA9IGV4dGVuZCh7fSwgc3RhdGUpO1xuXHRcdFx0cGVuZGluZ1N0YXRlcy5mb3JFYWNoKGZ1bmN0aW9uIChuZXh0U3RhdGUpIHtcblx0XHRcdFx0dmFyIGlzUmVwbGFjZSA9IGlzQXJyKG5leHRTdGF0ZSk7XG5cdFx0XHRcdGlmIChpc1JlcGxhY2UpIHtcblx0XHRcdFx0XHRuZXh0U3RhdGUgPSBuZXh0U3RhdGVbMF07XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGlzRm4obmV4dFN0YXRlKSkge1xuXHRcdFx0XHRcdG5leHRTdGF0ZSA9IG5leHRTdGF0ZS5jYWxsKGluc3RhbmNlLCBzdGF0ZSwgcHJvcHMpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIHJlcGxhY2Ugc3RhdGVcblx0XHRcdFx0aWYgKGlzUmVwbGFjZSkge1xuXHRcdFx0XHRcdHN0YXRlID0gZXh0ZW5kKHt9LCBuZXh0U3RhdGUpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGV4dGVuZChzdGF0ZSwgbmV4dFN0YXRlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHRwZW5kaW5nU3RhdGVzLmxlbmd0aCA9IDA7XG5cdFx0fVxuXHRcdHJldHVybiBzdGF0ZTtcblx0fSxcblx0Y2xlYXJDYWxsYmFja3M6IGZ1bmN0aW9uIGNsZWFyQ2FsbGJhY2tzKCkge1xuXHRcdHZhciBwZW5kaW5nQ2FsbGJhY2tzID0gdGhpcy5wZW5kaW5nQ2FsbGJhY2tzO1xuXHRcdHZhciBpbnN0YW5jZSA9IHRoaXMuaW5zdGFuY2U7XG5cblx0XHRpZiAocGVuZGluZ0NhbGxiYWNrcy5sZW5ndGggPiAwKSB7XG5cdFx0XHR0aGlzLnBlbmRpbmdDYWxsYmFja3MgPSBbXTtcblx0XHRcdHBlbmRpbmdDYWxsYmFja3MuZm9yRWFjaChmdW5jdGlvbiAoY2FsbGJhY2spIHtcblx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrLmNhbGwoaW5zdGFuY2UpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9LFxuXHRhZGRDYWxsYmFjazogZnVuY3Rpb24gYWRkQ2FsbGJhY2soY2FsbGJhY2spIHtcblx0XHRpZiAoaXNGbihjYWxsYmFjaykpIHtcblx0XHRcdGFkZEl0ZW0odGhpcy5wZW5kaW5nQ2FsbGJhY2tzLCBjYWxsYmFjayk7XG5cdFx0fVxuXHR9XG59O1xuZnVuY3Rpb24gQ29tcG9uZW50KHByb3BzLCBjb250ZXh0KSB7XG5cdHRoaXMuJHVwZGF0ZXIgPSBuZXcgVXBkYXRlcih0aGlzKTtcblx0dGhpcy4kY2FjaGUgPSB7IGlzTW91bnRlZDogZmFsc2UgfTtcblx0dGhpcy5wcm9wcyA9IHByb3BzO1xuXHR0aGlzLnN0YXRlID0ge307XG5cdHRoaXMucmVmcyA9IHt9O1xuXHR0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xufVxuXG52YXIgUmVhY3RDb21wb25lbnRTeW1ib2wgPSB7fTtcblxuQ29tcG9uZW50LnByb3RvdHlwZSA9IHtcblx0Y29uc3RydWN0b3I6IENvbXBvbmVudCxcblx0aXNSZWFjdENvbXBvbmVudDogUmVhY3RDb21wb25lbnRTeW1ib2wsXG5cdC8vIGdldENoaWxkQ29udGV4dDogXy5ub29wLFxuXHQvLyBjb21wb25lbnRXaWxsVXBkYXRlOiBfLm5vb3AsXG5cdC8vIGNvbXBvbmVudERpZFVwZGF0ZTogXy5ub29wLFxuXHQvLyBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzOiBfLm5vb3AsXG5cdC8vIGNvbXBvbmVudFdpbGxNb3VudDogXy5ub29wLFxuXHQvLyBjb21wb25lbnREaWRNb3VudDogXy5ub29wLFxuXHQvLyBjb21wb25lbnRXaWxsVW5tb3VudDogXy5ub29wLFxuXHQvLyBzaG91bGRDb21wb25lbnRVcGRhdGUobmV4dFByb3BzLCBuZXh0U3RhdGUpIHtcblx0Ly8gXHRyZXR1cm4gdHJ1ZVxuXHQvLyB9LFxuXHRmb3JjZVVwZGF0ZTogZnVuY3Rpb24gZm9yY2VVcGRhdGUoY2FsbGJhY2spIHtcblx0XHR2YXIgJHVwZGF0ZXIgPSB0aGlzLiR1cGRhdGVyO1xuXHRcdHZhciAkY2FjaGUgPSB0aGlzLiRjYWNoZTtcblx0XHR2YXIgcHJvcHMgPSB0aGlzLnByb3BzO1xuXHRcdHZhciBzdGF0ZSA9IHRoaXMuc3RhdGU7XG5cdFx0dmFyIGNvbnRleHQgPSB0aGlzLmNvbnRleHQ7XG5cblx0XHRpZiAoISRjYWNoZS5pc01vdW50ZWQpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0Ly8gaWYgdXBkYXRlciBpcyBwZW5kaW5nLCBhZGQgc3RhdGUgdG8gdHJpZ2dlciBuZXh0dGljayB1cGRhdGVcblx0XHRpZiAoJHVwZGF0ZXIuaXNQZW5kaW5nKSB7XG5cdFx0XHQkdXBkYXRlci5hZGRTdGF0ZShzdGF0ZSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHZhciBuZXh0UHJvcHMgPSAkY2FjaGUucHJvcHMgfHwgcHJvcHM7XG5cdFx0dmFyIG5leHRTdGF0ZSA9ICRjYWNoZS5zdGF0ZSB8fCBzdGF0ZTtcblx0XHR2YXIgbmV4dENvbnRleHQgPSAkY2FjaGUuY29udGV4dCB8fCBjb250ZXh0O1xuXHRcdHZhciBwYXJlbnRDb250ZXh0ID0gJGNhY2hlLnBhcmVudENvbnRleHQ7XG5cdFx0dmFyIG5vZGUgPSAkY2FjaGUubm9kZTtcblx0XHR2YXIgdm5vZGUgPSAkY2FjaGUudm5vZGU7XG5cdFx0JGNhY2hlLnByb3BzID0gJGNhY2hlLnN0YXRlID0gJGNhY2hlLmNvbnRleHQgPSBudWxsO1xuXHRcdCR1cGRhdGVyLmlzUGVuZGluZyA9IHRydWU7XG5cdFx0aWYgKHRoaXMuY29tcG9uZW50V2lsbFVwZGF0ZSkge1xuXHRcdFx0dGhpcy5jb21wb25lbnRXaWxsVXBkYXRlKG5leHRQcm9wcywgbmV4dFN0YXRlLCBuZXh0Q29udGV4dCk7XG5cdFx0fVxuXHRcdHRoaXMuc3RhdGUgPSBuZXh0U3RhdGU7XG5cdFx0dGhpcy5wcm9wcyA9IG5leHRQcm9wcztcblx0XHR0aGlzLmNvbnRleHQgPSBuZXh0Q29udGV4dDtcblx0XHR2YXIgbmV3Vm5vZGUgPSByZW5kZXJDb21wb25lbnQodGhpcyk7XG5cdFx0dmFyIG5ld05vZGUgPSBjb21wYXJlVHdvVm5vZGVzKHZub2RlLCBuZXdWbm9kZSwgbm9kZSwgZ2V0Q2hpbGRDb250ZXh0KHRoaXMsIHBhcmVudENvbnRleHQpKTtcblx0XHRpZiAobmV3Tm9kZSAhPT0gbm9kZSkge1xuXHRcdFx0bmV3Tm9kZS5jYWNoZSA9IG5ld05vZGUuY2FjaGUgfHwge307XG5cdFx0XHRzeW5jQ2FjaGUobmV3Tm9kZS5jYWNoZSwgbm9kZS5jYWNoZSwgbmV3Tm9kZSk7XG5cdFx0fVxuXHRcdCRjYWNoZS52bm9kZSA9IG5ld1Zub2RlO1xuXHRcdCRjYWNoZS5ub2RlID0gbmV3Tm9kZTtcblx0XHRjbGVhclBlbmRpbmcoKTtcblx0XHRpZiAodGhpcy5jb21wb25lbnREaWRVcGRhdGUpIHtcblx0XHRcdHRoaXMuY29tcG9uZW50RGlkVXBkYXRlKHByb3BzLCBzdGF0ZSwgY29udGV4dCk7XG5cdFx0fVxuXHRcdGlmIChjYWxsYmFjaykge1xuXHRcdFx0Y2FsbGJhY2suY2FsbCh0aGlzKTtcblx0XHR9XG5cdFx0JHVwZGF0ZXIuaXNQZW5kaW5nID0gZmFsc2U7XG5cdFx0JHVwZGF0ZXIuZW1pdFVwZGF0ZSgpO1xuXHR9LFxuXHRzZXRTdGF0ZTogZnVuY3Rpb24gc2V0U3RhdGUobmV4dFN0YXRlLCBjYWxsYmFjaykge1xuXHRcdHZhciAkdXBkYXRlciA9IHRoaXMuJHVwZGF0ZXI7XG5cblx0XHQkdXBkYXRlci5hZGRDYWxsYmFjayhjYWxsYmFjayk7XG5cdFx0JHVwZGF0ZXIuYWRkU3RhdGUobmV4dFN0YXRlKTtcblx0fSxcblx0cmVwbGFjZVN0YXRlOiBmdW5jdGlvbiByZXBsYWNlU3RhdGUobmV4dFN0YXRlLCBjYWxsYmFjaykge1xuXHRcdHZhciAkdXBkYXRlciA9IHRoaXMuJHVwZGF0ZXI7XG5cblx0XHQkdXBkYXRlci5hZGRDYWxsYmFjayhjYWxsYmFjayk7XG5cdFx0JHVwZGF0ZXIucmVwbGFjZVN0YXRlKG5leHRTdGF0ZSk7XG5cdH0sXG5cdGdldERPTU5vZGU6IGZ1bmN0aW9uIGdldERPTU5vZGUoKSB7XG5cdFx0dmFyIG5vZGUgPSB0aGlzLiRjYWNoZS5ub2RlO1xuXHRcdHJldHVybiBub2RlICYmIG5vZGUubm9kZU5hbWUgPT09ICcjY29tbWVudCcgPyBudWxsIDogbm9kZTtcblx0fSxcblx0aXNNb3VudGVkOiBmdW5jdGlvbiBpc01vdW50ZWQoKSB7XG5cdFx0cmV0dXJuIHRoaXMuJGNhY2hlLmlzTW91bnRlZDtcblx0fVxufTtcblxuZnVuY3Rpb24gc2hvdWxkVXBkYXRlKGNvbXBvbmVudCwgbmV4dFByb3BzLCBuZXh0U3RhdGUsIG5leHRDb250ZXh0LCBjYWxsYmFjaykge1xuXHR2YXIgc2hvdWxkQ29tcG9uZW50VXBkYXRlID0gdHJ1ZTtcblx0aWYgKGNvbXBvbmVudC5zaG91bGRDb21wb25lbnRVcGRhdGUpIHtcblx0XHRzaG91bGRDb21wb25lbnRVcGRhdGUgPSBjb21wb25lbnQuc2hvdWxkQ29tcG9uZW50VXBkYXRlKG5leHRQcm9wcywgbmV4dFN0YXRlLCBuZXh0Q29udGV4dCk7XG5cdH1cblx0aWYgKHNob3VsZENvbXBvbmVudFVwZGF0ZSA9PT0gZmFsc2UpIHtcblx0XHRjb21wb25lbnQucHJvcHMgPSBuZXh0UHJvcHM7XG5cdFx0Y29tcG9uZW50LnN0YXRlID0gbmV4dFN0YXRlO1xuXHRcdGNvbXBvbmVudC5jb250ZXh0ID0gbmV4dENvbnRleHQgfHwge307XG5cdFx0cmV0dXJuO1xuXHR9XG5cdHZhciBjYWNoZSA9IGNvbXBvbmVudC4kY2FjaGU7XG5cdGNhY2hlLnByb3BzID0gbmV4dFByb3BzO1xuXHRjYWNoZS5zdGF0ZSA9IG5leHRTdGF0ZTtcblx0Y2FjaGUuY29udGV4dCA9IG5leHRDb250ZXh0IHx8IHt9O1xuXHRjb21wb25lbnQuZm9yY2VVcGRhdGUoY2FsbGJhY2spO1xufVxuXG4vLyBldmVudCBjb25maWdcbnZhciB1bmJ1YmJsZUV2ZW50cyA9IHtcbiAgICAvKipcclxuICAgICAqIHNob3VsZCBub3QgYmluZCBtb3VzZW1vdmUgaW4gZG9jdW1lbnQgc2NvcGVcclxuICAgICAqIGV2ZW4gdGhvdWdoIG1vdXNlbW92ZSBldmVudCBjYW4gYnViYmxlXHJcbiAgICAgKi9cbiAgICBvbm1vdXNlbW92ZTogMSxcbiAgICBvbm1vdXNlbGVhdmU6IDEsXG4gICAgb25tb3VzZWVudGVyOiAxLFxuICAgIG9ubG9hZDogMSxcbiAgICBvbnVubG9hZDogMSxcbiAgICBvbnNjcm9sbDogMSxcbiAgICBvbmZvY3VzOiAxLFxuICAgIG9uYmx1cjogMSxcbiAgICBvbnJvd2V4aXQ6IDEsXG4gICAgb25iZWZvcmV1bmxvYWQ6IDEsXG4gICAgb25zdG9wOiAxLFxuICAgIG9uZHJhZ2Ryb3A6IDEsXG4gICAgb25kcmFnZW50ZXI6IDEsXG4gICAgb25kcmFnZXhpdDogMSxcbiAgICBvbmRyYWdnZXN0dXJlOiAxLFxuICAgIG9uZHJhZ292ZXI6IDEsXG4gICAgb25jb250ZXh0bWVudTogMVxufTtcblxuZnVuY3Rpb24gZ2V0RXZlbnROYW1lKGtleSkge1xuICAgIGlmIChrZXkgPT09ICdvbkRvdWJsZUNsaWNrJykge1xuICAgICAgICBrZXkgPSAnb25kYmxjbGljayc7XG4gICAgfSBlbHNlIGlmIChrZXkgPT09ICdvblRvdWNoVGFwJykge1xuICAgICAgICBrZXkgPSAnb25jbGljayc7XG4gICAgfVxuXG4gICAgcmV0dXJuIGtleS50b0xvd2VyQ2FzZSgpO1xufVxuXG4vLyBNb2JpbGUgU2FmYXJpIGRvZXMgbm90IGZpcmUgcHJvcGVybHkgYnViYmxlIGNsaWNrIGV2ZW50cyBvblxuLy8gbm9uLWludGVyYWN0aXZlIGVsZW1lbnRzLCB3aGljaCBtZWFucyBkZWxlZ2F0ZWQgY2xpY2sgbGlzdGVuZXJzIGRvIG5vdFxuLy8gZmlyZS4gVGhlIHdvcmthcm91bmQgZm9yIHRoaXMgYnVnIGludm9sdmVzIGF0dGFjaGluZyBhbiBlbXB0eSBjbGlja1xuLy8gbGlzdGVuZXIgb24gdGhlIHRhcmdldCBub2RlLlxudmFyIGluTW9iaWxlID0gKCdvbnRvdWNoc3RhcnQnIGluIGRvY3VtZW50KTtcbnZhciBlbXB0eUZ1bmN0aW9uID0gZnVuY3Rpb24gZW1wdHlGdW5jdGlvbigpIHt9O1xudmFyIE9OX0NMSUNLX0tFWSA9ICdvbmNsaWNrJztcblxudmFyIGV2ZW50VHlwZXMgPSB7fTtcblxuZnVuY3Rpb24gYWRkRXZlbnQoZWxlbSwgZXZlbnRUeXBlLCBsaXN0ZW5lcikge1xuICAgIGV2ZW50VHlwZSA9IGdldEV2ZW50TmFtZShldmVudFR5cGUpO1xuXG4gICAgdmFyIGV2ZW50U3RvcmUgPSBlbGVtLmV2ZW50U3RvcmUgfHwgKGVsZW0uZXZlbnRTdG9yZSA9IHt9KTtcbiAgICBldmVudFN0b3JlW2V2ZW50VHlwZV0gPSBsaXN0ZW5lcjtcblxuICAgIGlmICh1bmJ1YmJsZUV2ZW50c1tldmVudFR5cGVdID09PSAxKSB7XG4gICAgICAgIGVsZW1bZXZlbnRUeXBlXSA9IGRpc3BhdGNoVW5idWJibGVFdmVudDtcbiAgICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZiAoIWV2ZW50VHlwZXNbZXZlbnRUeXBlXSkge1xuICAgICAgICAvLyBvbmNsaWNrIC0+IGNsaWNrXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLnN1YnN0cigyKSwgZGlzcGF0Y2hFdmVudCwgZmFsc2UpO1xuICAgICAgICBldmVudFR5cGVzW2V2ZW50VHlwZV0gPSB0cnVlO1xuICAgIH1cblxuICAgIGlmIChpbk1vYmlsZSAmJiBldmVudFR5cGUgPT09IE9OX0NMSUNLX0tFWSkge1xuICAgICAgICBlbGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZW1wdHlGdW5jdGlvbiwgZmFsc2UpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIG5vZGVOYW1lID0gZWxlbS5ub2RlTmFtZTtcblxuICAgIGlmIChldmVudFR5cGUgPT09ICdvbmNoYW5nZScpIHtcbiAgICAgICAgYWRkRXZlbnQoZWxlbSwgJ29uaW5wdXQnLCBsaXN0ZW5lcik7XG4gICAgfVxufVxuXG5mdW5jdGlvbiByZW1vdmVFdmVudChlbGVtLCBldmVudFR5cGUpIHtcbiAgICBldmVudFR5cGUgPSBnZXRFdmVudE5hbWUoZXZlbnRUeXBlKTtcblxuICAgIHZhciBldmVudFN0b3JlID0gZWxlbS5ldmVudFN0b3JlIHx8IChlbGVtLmV2ZW50U3RvcmUgPSB7fSk7XG4gICAgZGVsZXRlIGV2ZW50U3RvcmVbZXZlbnRUeXBlXTtcblxuICAgIGlmICh1bmJ1YmJsZUV2ZW50c1tldmVudFR5cGVdID09PSAxKSB7XG4gICAgICAgIGVsZW1bZXZlbnRUeXBlXSA9IG51bGw7XG4gICAgICAgIHJldHVybjtcbiAgICB9IGVsc2UgaWYgKGluTW9iaWxlICYmIGV2ZW50VHlwZSA9PT0gT05fQ0xJQ0tfS0VZKSB7XG4gICAgICAgIGVsZW0ucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBlbXB0eUZ1bmN0aW9uLCBmYWxzZSk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgbm9kZU5hbWUgPSBlbGVtLm5vZGVOYW1lO1xuXG4gICAgaWYgKGV2ZW50VHlwZSA9PT0gJ29uY2hhbmdlJykge1xuICAgICAgICBkZWxldGUgZXZlbnRTdG9yZVsnb25pbnB1dCddO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZGlzcGF0Y2hFdmVudChldmVudCkge1xuICAgIHZhciB0YXJnZXQgPSBldmVudC50YXJnZXQ7XG4gICAgdmFyIHR5cGUgPSBldmVudC50eXBlO1xuXG4gICAgdmFyIGV2ZW50VHlwZSA9ICdvbicgKyB0eXBlO1xuICAgIHZhciBzeW50aGV0aWNFdmVudCA9IHVuZGVmaW5lZDtcblxuICAgIHVwZGF0ZVF1ZXVlLmlzUGVuZGluZyA9IHRydWU7XG4gICAgd2hpbGUgKHRhcmdldCkge1xuICAgICAgICB2YXIgX3RhcmdldCA9IHRhcmdldDtcbiAgICAgICAgdmFyIGV2ZW50U3RvcmUgPSBfdGFyZ2V0LmV2ZW50U3RvcmU7XG5cbiAgICAgICAgdmFyIGxpc3RlbmVyID0gZXZlbnRTdG9yZSAmJiBldmVudFN0b3JlW2V2ZW50VHlwZV07XG4gICAgICAgIGlmICghbGlzdGVuZXIpIHtcbiAgICAgICAgICAgIHRhcmdldCA9IHRhcmdldC5wYXJlbnROb2RlO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFzeW50aGV0aWNFdmVudCkge1xuICAgICAgICAgICAgc3ludGhldGljRXZlbnQgPSBjcmVhdGVTeW50aGV0aWNFdmVudChldmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgc3ludGhldGljRXZlbnQuY3VycmVudFRhcmdldCA9IHRhcmdldDtcbiAgICAgICAgbGlzdGVuZXIuY2FsbCh0YXJnZXQsIHN5bnRoZXRpY0V2ZW50KTtcbiAgICAgICAgaWYgKHN5bnRoZXRpY0V2ZW50LiRjYW5jZWxCdWJibGUpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHRhcmdldCA9IHRhcmdldC5wYXJlbnROb2RlO1xuICAgIH1cbiAgICB1cGRhdGVRdWV1ZS5pc1BlbmRpbmcgPSBmYWxzZTtcbiAgICB1cGRhdGVRdWV1ZS5iYXRjaFVwZGF0ZSgpO1xufVxuXG5mdW5jdGlvbiBkaXNwYXRjaFVuYnViYmxlRXZlbnQoZXZlbnQpIHtcbiAgICB2YXIgdGFyZ2V0ID0gZXZlbnQuY3VycmVudFRhcmdldCB8fCBldmVudC50YXJnZXQ7XG4gICAgdmFyIGV2ZW50VHlwZSA9ICdvbicgKyBldmVudC50eXBlO1xuICAgIHZhciBzeW50aGV0aWNFdmVudCA9IGNyZWF0ZVN5bnRoZXRpY0V2ZW50KGV2ZW50KTtcblxuICAgIHN5bnRoZXRpY0V2ZW50LmN1cnJlbnRUYXJnZXQgPSB0YXJnZXQ7XG4gICAgdXBkYXRlUXVldWUuaXNQZW5kaW5nID0gdHJ1ZTtcblxuICAgIHZhciBldmVudFN0b3JlID0gdGFyZ2V0LmV2ZW50U3RvcmU7XG5cbiAgICB2YXIgbGlzdGVuZXIgPSBldmVudFN0b3JlICYmIGV2ZW50U3RvcmVbZXZlbnRUeXBlXTtcbiAgICBpZiAobGlzdGVuZXIpIHtcbiAgICAgICAgbGlzdGVuZXIuY2FsbCh0YXJnZXQsIHN5bnRoZXRpY0V2ZW50KTtcbiAgICB9XG5cbiAgICB1cGRhdGVRdWV1ZS5pc1BlbmRpbmcgPSBmYWxzZTtcbiAgICB1cGRhdGVRdWV1ZS5iYXRjaFVwZGF0ZSgpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVTeW50aGV0aWNFdmVudChuYXRpdmVFdmVudCkge1xuICAgIHZhciBzeW50aGV0aWNFdmVudCA9IHt9O1xuICAgIHZhciBjYW5jZWxCdWJibGUgPSBmdW5jdGlvbiBjYW5jZWxCdWJibGUoKSB7XG4gICAgICAgIHJldHVybiBzeW50aGV0aWNFdmVudC4kY2FuY2VsQnViYmxlID0gdHJ1ZTtcbiAgICB9O1xuICAgIHN5bnRoZXRpY0V2ZW50Lm5hdGl2ZUV2ZW50ID0gbmF0aXZlRXZlbnQ7XG4gICAgc3ludGhldGljRXZlbnQucGVyc2lzdCA9IG5vb3A7XG4gICAgZm9yICh2YXIga2V5IGluIG5hdGl2ZUV2ZW50KSB7XG4gICAgICAgIGlmICh0eXBlb2YgbmF0aXZlRXZlbnRba2V5XSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgc3ludGhldGljRXZlbnRba2V5XSA9IG5hdGl2ZUV2ZW50W2tleV07XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5ID09PSAnc3RvcFByb3BhZ2F0aW9uJyB8fCBrZXkgPT09ICdzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24nKSB7XG4gICAgICAgICAgICBzeW50aGV0aWNFdmVudFtrZXldID0gY2FuY2VsQnViYmxlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3ludGhldGljRXZlbnRba2V5XSA9IG5hdGl2ZUV2ZW50W2tleV0uYmluZChuYXRpdmVFdmVudCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHN5bnRoZXRpY0V2ZW50O1xufVxuXG5mdW5jdGlvbiBzZXRTdHlsZShlbGVtU3R5bGUsIHN0eWxlcykge1xuICAgIGZvciAodmFyIHN0eWxlTmFtZSBpbiBzdHlsZXMpIHtcbiAgICAgICAgaWYgKHN0eWxlcy5oYXNPd25Qcm9wZXJ0eShzdHlsZU5hbWUpKSB7XG4gICAgICAgICAgICBzZXRTdHlsZVZhbHVlKGVsZW1TdHlsZSwgc3R5bGVOYW1lLCBzdHlsZXNbc3R5bGVOYW1lXSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlbW92ZVN0eWxlKGVsZW1TdHlsZSwgc3R5bGVzKSB7XG4gICAgZm9yICh2YXIgc3R5bGVOYW1lIGluIHN0eWxlcykge1xuICAgICAgICBpZiAoc3R5bGVzLmhhc093blByb3BlcnR5KHN0eWxlTmFtZSkpIHtcbiAgICAgICAgICAgIGVsZW1TdHlsZVtzdHlsZU5hbWVdID0gJyc7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHBhdGNoU3R5bGUoZWxlbVN0eWxlLCBzdHlsZSwgbmV3U3R5bGUpIHtcbiAgICBpZiAoc3R5bGUgPT09IG5ld1N0eWxlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCFuZXdTdHlsZSAmJiBzdHlsZSkge1xuICAgICAgICByZW1vdmVTdHlsZShlbGVtU3R5bGUsIHN0eWxlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZiAobmV3U3R5bGUgJiYgIXN0eWxlKSB7XG4gICAgICAgIHNldFN0eWxlKGVsZW1TdHlsZSwgbmV3U3R5bGUpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZm9yICh2YXIga2V5IGluIHN0eWxlKSB7XG4gICAgICAgIGlmIChuZXdTdHlsZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICBpZiAobmV3U3R5bGVba2V5XSAhPT0gc3R5bGVba2V5XSkge1xuICAgICAgICAgICAgICAgIHNldFN0eWxlVmFsdWUoZWxlbVN0eWxlLCBrZXksIG5ld1N0eWxlW2tleV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWxlbVN0eWxlW2tleV0gPSAnJztcbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKHZhciBrZXkgaW4gbmV3U3R5bGUpIHtcbiAgICAgICAgaWYgKCFzdHlsZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICBzZXRTdHlsZVZhbHVlKGVsZW1TdHlsZSwga2V5LCBuZXdTdHlsZVtrZXldKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyoqXHJcbiAqIENTUyBwcm9wZXJ0aWVzIHdoaWNoIGFjY2VwdCBudW1iZXJzIGJ1dCBhcmUgbm90IGluIHVuaXRzIG9mIFwicHhcIi5cclxuICovXG52YXIgaXNVbml0bGVzc051bWJlciA9IHtcbiAgICBhbmltYXRpb25JdGVyYXRpb25Db3VudDogMSxcbiAgICBib3JkZXJJbWFnZU91dHNldDogMSxcbiAgICBib3JkZXJJbWFnZVNsaWNlOiAxLFxuICAgIGJvcmRlckltYWdlV2lkdGg6IDEsXG4gICAgYm94RmxleDogMSxcbiAgICBib3hGbGV4R3JvdXA6IDEsXG4gICAgYm94T3JkaW5hbEdyb3VwOiAxLFxuICAgIGNvbHVtbkNvdW50OiAxLFxuICAgIGZsZXg6IDEsXG4gICAgZmxleEdyb3c6IDEsXG4gICAgZmxleFBvc2l0aXZlOiAxLFxuICAgIGZsZXhTaHJpbms6IDEsXG4gICAgZmxleE5lZ2F0aXZlOiAxLFxuICAgIGZsZXhPcmRlcjogMSxcbiAgICBncmlkUm93OiAxLFxuICAgIGdyaWRDb2x1bW46IDEsXG4gICAgZm9udFdlaWdodDogMSxcbiAgICBsaW5lQ2xhbXA6IDEsXG4gICAgbGluZUhlaWdodDogMSxcbiAgICBvcGFjaXR5OiAxLFxuICAgIG9yZGVyOiAxLFxuICAgIG9ycGhhbnM6IDEsXG4gICAgdGFiU2l6ZTogMSxcbiAgICB3aWRvd3M6IDEsXG4gICAgekluZGV4OiAxLFxuICAgIHpvb206IDEsXG5cbiAgICAvLyBTVkctcmVsYXRlZCBwcm9wZXJ0aWVzXG4gICAgZmlsbE9wYWNpdHk6IDEsXG4gICAgZmxvb2RPcGFjaXR5OiAxLFxuICAgIHN0b3BPcGFjaXR5OiAxLFxuICAgIHN0cm9rZURhc2hhcnJheTogMSxcbiAgICBzdHJva2VEYXNob2Zmc2V0OiAxLFxuICAgIHN0cm9rZU1pdGVybGltaXQ6IDEsXG4gICAgc3Ryb2tlT3BhY2l0eTogMSxcbiAgICBzdHJva2VXaWR0aDogMVxufTtcblxuZnVuY3Rpb24gcHJlZml4S2V5KHByZWZpeCwga2V5KSB7XG4gICAgcmV0dXJuIHByZWZpeCArIGtleS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIGtleS5zdWJzdHJpbmcoMSk7XG59XG5cbnZhciBwcmVmaXhlcyA9IFsnV2Via2l0JywgJ21zJywgJ01veicsICdPJ107XG5cbk9iamVjdC5rZXlzKGlzVW5pdGxlc3NOdW1iZXIpLmZvckVhY2goZnVuY3Rpb24gKHByb3ApIHtcbiAgICBwcmVmaXhlcy5mb3JFYWNoKGZ1bmN0aW9uIChwcmVmaXgpIHtcbiAgICAgICAgaXNVbml0bGVzc051bWJlcltwcmVmaXhLZXkocHJlZml4LCBwcm9wKV0gPSAxO1xuICAgIH0pO1xufSk7XG5cbnZhciBSRV9OVU1CRVIgPSAvXi0/XFxkKyhcXC5cXGQrKT8kLztcbmZ1bmN0aW9uIHNldFN0eWxlVmFsdWUoZWxlbVN0eWxlLCBzdHlsZU5hbWUsIHN0eWxlVmFsdWUpIHtcblxuICAgIGlmICghaXNVbml0bGVzc051bWJlcltzdHlsZU5hbWVdICYmIFJFX05VTUJFUi50ZXN0KHN0eWxlVmFsdWUpKSB7XG4gICAgICAgIGVsZW1TdHlsZVtzdHlsZU5hbWVdID0gc3R5bGVWYWx1ZSArICdweCc7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoc3R5bGVOYW1lID09PSAnZmxvYXQnKSB7XG4gICAgICAgIHN0eWxlTmFtZSA9ICdjc3NGbG9hdCc7XG4gICAgfVxuXG4gICAgaWYgKHN0eWxlVmFsdWUgPT0gbnVsbCB8fCB0eXBlb2Ygc3R5bGVWYWx1ZSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgIHN0eWxlVmFsdWUgPSAnJztcbiAgICB9XG5cbiAgICBlbGVtU3R5bGVbc3R5bGVOYW1lXSA9IHN0eWxlVmFsdWU7XG59XG5cbnZhciBBVFRSSUJVVEVfTkFNRV9TVEFSVF9DSEFSID0gJzpBLVpfYS16XFxcXHUwMEMwLVxcXFx1MDBENlxcXFx1MDBEOC1cXFxcdTAwRjZcXFxcdTAwRjgtXFxcXHUwMkZGXFxcXHUwMzcwLVxcXFx1MDM3RFxcXFx1MDM3Ri1cXFxcdTFGRkZcXFxcdTIwMEMtXFxcXHUyMDBEXFxcXHUyMDcwLVxcXFx1MjE4RlxcXFx1MkMwMC1cXFxcdTJGRUZcXFxcdTMwMDEtXFxcXHVEN0ZGXFxcXHVGOTAwLVxcXFx1RkRDRlxcXFx1RkRGMC1cXFxcdUZGRkQnO1xudmFyIEFUVFJJQlVURV9OQU1FX0NIQVIgPSBBVFRSSUJVVEVfTkFNRV9TVEFSVF9DSEFSICsgJ1xcXFwtLjAtOVxcXFx1QjdcXFxcdTAzMDAtXFxcXHUwMzZGXFxcXHUyMDNGLVxcXFx1MjA0MCc7XG5cbnZhciBWQUxJRF9BVFRSSUJVVEVfTkFNRV9SRUdFWCA9IG5ldyBSZWdFeHAoJ15bJyArIEFUVFJJQlVURV9OQU1FX1NUQVJUX0NIQVIgKyAnXVsnICsgQVRUUklCVVRFX05BTUVfQ0hBUiArICddKiQnKTtcblxudmFyIGlzQ3VzdG9tQXR0cmlidXRlID0gUmVnRXhwLnByb3RvdHlwZS50ZXN0LmJpbmQobmV3IFJlZ0V4cCgnXihkYXRhfGFyaWEpLVsnICsgQVRUUklCVVRFX05BTUVfQ0hBUiArICddKiQnKSk7XG4vLyB3aWxsIG1lcmdlIHNvbWUgZGF0YSBpbiBwcm9wZXJ0aWVzIGJlbG93XG52YXIgcHJvcGVydGllcyA9IHt9O1xuXG4vKipcclxuICogTWFwcGluZyBmcm9tIG5vcm1hbGl6ZWQsIGNhbWVsY2FzZWQgcHJvcGVydHkgbmFtZXMgdG8gYSBjb25maWd1cmF0aW9uIHRoYXRcclxuICogc3BlY2lmaWVzIGhvdyB0aGUgYXNzb2NpYXRlZCBET00gcHJvcGVydHkgc2hvdWxkIGJlIGFjY2Vzc2VkIG9yIHJlbmRlcmVkLlxyXG4gKi9cbnZhciBNVVNUX1VTRV9QUk9QRVJUWSA9IDB4MTtcbnZhciBIQVNfQk9PTEVBTl9WQUxVRSA9IDB4NDtcbnZhciBIQVNfTlVNRVJJQ19WQUxVRSA9IDB4ODtcbnZhciBIQVNfUE9TSVRJVkVfTlVNRVJJQ19WQUxVRSA9IDB4MTAgfCAweDg7XG52YXIgSEFTX09WRVJMT0FERURfQk9PTEVBTl9WQUxVRSA9IDB4MjA7XG5cbi8vIGh0bWwgY29uZmlnXG52YXIgSFRNTERPTVByb3BlcnR5Q29uZmlnID0ge1xuICAgIHByb3BzOiB7XG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFN0YW5kYXJkIFByb3BlcnRpZXNcclxuICAgICAgICAgKi9cbiAgICAgICAgYWNjZXB0OiAwLFxuICAgICAgICBhY2NlcHRDaGFyc2V0OiAwLFxuICAgICAgICBhY2Nlc3NLZXk6IDAsXG4gICAgICAgIGFjdGlvbjogMCxcbiAgICAgICAgYWxsb3dGdWxsU2NyZWVuOiBIQVNfQk9PTEVBTl9WQUxVRSxcbiAgICAgICAgYWxsb3dUcmFuc3BhcmVuY3k6IDAsXG4gICAgICAgIGFsdDogMCxcbiAgICAgICAgYXN5bmM6IEhBU19CT09MRUFOX1ZBTFVFLFxuICAgICAgICBhdXRvQ29tcGxldGU6IDAsXG4gICAgICAgIGF1dG9Gb2N1czogSEFTX0JPT0xFQU5fVkFMVUUsXG4gICAgICAgIGF1dG9QbGF5OiBIQVNfQk9PTEVBTl9WQUxVRSxcbiAgICAgICAgY2FwdHVyZTogSEFTX0JPT0xFQU5fVkFMVUUsXG4gICAgICAgIGNlbGxQYWRkaW5nOiAwLFxuICAgICAgICBjZWxsU3BhY2luZzogMCxcbiAgICAgICAgY2hhclNldDogMCxcbiAgICAgICAgY2hhbGxlbmdlOiAwLFxuICAgICAgICBjaGVja2VkOiBNVVNUX1VTRV9QUk9QRVJUWSB8IEhBU19CT09MRUFOX1ZBTFVFLFxuICAgICAgICBjaXRlOiAwLFxuICAgICAgICBjbGFzc0lEOiAwLFxuICAgICAgICBjbGFzc05hbWU6IDAsXG4gICAgICAgIGNvbHM6IEhBU19QT1NJVElWRV9OVU1FUklDX1ZBTFVFLFxuICAgICAgICBjb2xTcGFuOiAwLFxuICAgICAgICBjb250ZW50OiAwLFxuICAgICAgICBjb250ZW50RWRpdGFibGU6IDAsXG4gICAgICAgIGNvbnRleHRNZW51OiAwLFxuICAgICAgICBjb250cm9sczogSEFTX0JPT0xFQU5fVkFMVUUsXG4gICAgICAgIGNvb3JkczogMCxcbiAgICAgICAgY3Jvc3NPcmlnaW46IDAsXG4gICAgICAgIGRhdGE6IDAsIC8vIEZvciBgPG9iamVjdCAvPmAgYWN0cyBhcyBgc3JjYC5cbiAgICAgICAgZGF0ZVRpbWU6IDAsXG4gICAgICAgICdkZWZhdWx0JzogSEFTX0JPT0xFQU5fVkFMVUUsXG4gICAgICAgIC8vIG5vdCBpbiByZWd1bGFyIHJlYWN0LCB0aGV5IGRpZCBpdCBpbiBvdGhlciB3YXlcbiAgICAgICAgZGVmYXVsdFZhbHVlOiBNVVNUX1VTRV9QUk9QRVJUWSxcbiAgICAgICAgLy8gbm90IGluIHJlZ3VsYXIgcmVhY3QsIHRoZXkgZGlkIGl0IGluIG90aGVyIHdheVxuICAgICAgICBkZWZhdWx0Q2hlY2tlZDogTVVTVF9VU0VfUFJPUEVSVFkgfCBIQVNfQk9PTEVBTl9WQUxVRSxcbiAgICAgICAgZGVmZXI6IEhBU19CT09MRUFOX1ZBTFVFLFxuICAgICAgICBkaXI6IDAsXG4gICAgICAgIGRpc2FibGVkOiBIQVNfQk9PTEVBTl9WQUxVRSxcbiAgICAgICAgZG93bmxvYWQ6IEhBU19PVkVSTE9BREVEX0JPT0xFQU5fVkFMVUUsXG4gICAgICAgIGRyYWdnYWJsZTogMCxcbiAgICAgICAgZW5jVHlwZTogMCxcbiAgICAgICAgZm9ybTogMCxcbiAgICAgICAgZm9ybUFjdGlvbjogMCxcbiAgICAgICAgZm9ybUVuY1R5cGU6IDAsXG4gICAgICAgIGZvcm1NZXRob2Q6IDAsXG4gICAgICAgIGZvcm1Ob1ZhbGlkYXRlOiBIQVNfQk9PTEVBTl9WQUxVRSxcbiAgICAgICAgZm9ybVRhcmdldDogMCxcbiAgICAgICAgZnJhbWVCb3JkZXI6IDAsXG4gICAgICAgIGhlYWRlcnM6IDAsXG4gICAgICAgIGhlaWdodDogMCxcbiAgICAgICAgaGlkZGVuOiBIQVNfQk9PTEVBTl9WQUxVRSxcbiAgICAgICAgaGlnaDogMCxcbiAgICAgICAgaHJlZjogMCxcbiAgICAgICAgaHJlZkxhbmc6IDAsXG4gICAgICAgIGh0bWxGb3I6IDAsXG4gICAgICAgIGh0dHBFcXVpdjogMCxcbiAgICAgICAgaWNvbjogMCxcbiAgICAgICAgaWQ6IDAsXG4gICAgICAgIGlucHV0TW9kZTogMCxcbiAgICAgICAgaW50ZWdyaXR5OiAwLFxuICAgICAgICBpczogMCxcbiAgICAgICAga2V5UGFyYW1zOiAwLFxuICAgICAgICBrZXlUeXBlOiAwLFxuICAgICAgICBraW5kOiAwLFxuICAgICAgICBsYWJlbDogMCxcbiAgICAgICAgbGFuZzogMCxcbiAgICAgICAgbGlzdDogMCxcbiAgICAgICAgbG9vcDogSEFTX0JPT0xFQU5fVkFMVUUsXG4gICAgICAgIGxvdzogMCxcbiAgICAgICAgbWFuaWZlc3Q6IDAsXG4gICAgICAgIG1hcmdpbkhlaWdodDogMCxcbiAgICAgICAgbWFyZ2luV2lkdGg6IDAsXG4gICAgICAgIG1heDogMCxcbiAgICAgICAgbWF4TGVuZ3RoOiAwLFxuICAgICAgICBtZWRpYTogMCxcbiAgICAgICAgbWVkaWFHcm91cDogMCxcbiAgICAgICAgbWV0aG9kOiAwLFxuICAgICAgICBtaW46IDAsXG4gICAgICAgIG1pbkxlbmd0aDogMCxcbiAgICAgICAgLy8gQ2F1dGlvbjsgYG9wdGlvbi5zZWxlY3RlZGAgaXMgbm90IHVwZGF0ZWQgaWYgYHNlbGVjdC5tdWx0aXBsZWAgaXNcbiAgICAgICAgLy8gZGlzYWJsZWQgd2l0aCBgcmVtb3ZlQXR0cmlidXRlYC5cbiAgICAgICAgbXVsdGlwbGU6IE1VU1RfVVNFX1BST1BFUlRZIHwgSEFTX0JPT0xFQU5fVkFMVUUsXG4gICAgICAgIG11dGVkOiBNVVNUX1VTRV9QUk9QRVJUWSB8IEhBU19CT09MRUFOX1ZBTFVFLFxuICAgICAgICBuYW1lOiAwLFxuICAgICAgICBub25jZTogMCxcbiAgICAgICAgbm9WYWxpZGF0ZTogSEFTX0JPT0xFQU5fVkFMVUUsXG4gICAgICAgIG9wZW46IEhBU19CT09MRUFOX1ZBTFVFLFxuICAgICAgICBvcHRpbXVtOiAwLFxuICAgICAgICBwYXR0ZXJuOiAwLFxuICAgICAgICBwbGFjZWhvbGRlcjogMCxcbiAgICAgICAgcG9zdGVyOiAwLFxuICAgICAgICBwcmVsb2FkOiAwLFxuICAgICAgICBwcm9maWxlOiAwLFxuICAgICAgICByYWRpb0dyb3VwOiAwLFxuICAgICAgICByZWFkT25seTogSEFTX0JPT0xFQU5fVkFMVUUsXG4gICAgICAgIHJlZmVycmVyUG9saWN5OiAwLFxuICAgICAgICByZWw6IDAsXG4gICAgICAgIHJlcXVpcmVkOiBIQVNfQk9PTEVBTl9WQUxVRSxcbiAgICAgICAgcmV2ZXJzZWQ6IEhBU19CT09MRUFOX1ZBTFVFLFxuICAgICAgICByb2xlOiAwLFxuICAgICAgICByb3dzOiBIQVNfUE9TSVRJVkVfTlVNRVJJQ19WQUxVRSxcbiAgICAgICAgcm93U3BhbjogSEFTX05VTUVSSUNfVkFMVUUsXG4gICAgICAgIHNhbmRib3g6IDAsXG4gICAgICAgIHNjb3BlOiAwLFxuICAgICAgICBzY29wZWQ6IEhBU19CT09MRUFOX1ZBTFVFLFxuICAgICAgICBzY3JvbGxpbmc6IDAsXG4gICAgICAgIHNlYW1sZXNzOiBIQVNfQk9PTEVBTl9WQUxVRSxcbiAgICAgICAgc2VsZWN0ZWQ6IE1VU1RfVVNFX1BST1BFUlRZIHwgSEFTX0JPT0xFQU5fVkFMVUUsXG4gICAgICAgIHNoYXBlOiAwLFxuICAgICAgICBzaXplOiBIQVNfUE9TSVRJVkVfTlVNRVJJQ19WQUxVRSxcbiAgICAgICAgc2l6ZXM6IDAsXG4gICAgICAgIHNwYW46IEhBU19QT1NJVElWRV9OVU1FUklDX1ZBTFVFLFxuICAgICAgICBzcGVsbENoZWNrOiAwLFxuICAgICAgICBzcmM6IDAsXG4gICAgICAgIHNyY0RvYzogMCxcbiAgICAgICAgc3JjTGFuZzogMCxcbiAgICAgICAgc3JjU2V0OiAwLFxuICAgICAgICBzdGFydDogSEFTX05VTUVSSUNfVkFMVUUsXG4gICAgICAgIHN0ZXA6IDAsXG4gICAgICAgIHN0eWxlOiAwLFxuICAgICAgICBzdW1tYXJ5OiAwLFxuICAgICAgICB0YWJJbmRleDogMCxcbiAgICAgICAgdGFyZ2V0OiAwLFxuICAgICAgICB0aXRsZTogMCxcbiAgICAgICAgLy8gU2V0dGluZyAudHlwZSB0aHJvd3Mgb24gbm9uLTxpbnB1dD4gdGFnc1xuICAgICAgICB0eXBlOiAwLFxuICAgICAgICB1c2VNYXA6IDAsXG4gICAgICAgIHZhbHVlOiBNVVNUX1VTRV9QUk9QRVJUWSxcbiAgICAgICAgd2lkdGg6IDAsXG4gICAgICAgIHdtb2RlOiAwLFxuICAgICAgICB3cmFwOiAwLFxuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFJERmEgUHJvcGVydGllc1xyXG4gICAgICAgICAqL1xuICAgICAgICBhYm91dDogMCxcbiAgICAgICAgZGF0YXR5cGU6IDAsXG4gICAgICAgIGlubGlzdDogMCxcbiAgICAgICAgcHJlZml4OiAwLFxuICAgICAgICAvLyBwcm9wZXJ0eSBpcyBhbHNvIHN1cHBvcnRlZCBmb3IgT3BlbkdyYXBoIGluIG1ldGEgdGFncy5cbiAgICAgICAgcHJvcGVydHk6IDAsXG4gICAgICAgIHJlc291cmNlOiAwLFxuICAgICAgICAndHlwZW9mJzogMCxcbiAgICAgICAgdm9jYWI6IDAsXG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogTm9uLXN0YW5kYXJkIFByb3BlcnRpZXNcclxuICAgICAgICAgKi9cbiAgICAgICAgLy8gYXV0b0NhcGl0YWxpemUgYW5kIGF1dG9Db3JyZWN0IGFyZSBzdXBwb3J0ZWQgaW4gTW9iaWxlIFNhZmFyaSBmb3JcbiAgICAgICAgLy8ga2V5Ym9hcmQgaGludHMuXG4gICAgICAgIGF1dG9DYXBpdGFsaXplOiAwLFxuICAgICAgICBhdXRvQ29ycmVjdDogMCxcbiAgICAgICAgLy8gYXV0b1NhdmUgYWxsb3dzIFdlYktpdC9CbGluayB0byBwZXJzaXN0IHZhbHVlcyBvZiBpbnB1dCBmaWVsZHMgb24gcGFnZSByZWxvYWRzXG4gICAgICAgIGF1dG9TYXZlOiAwLFxuICAgICAgICAvLyBjb2xvciBpcyBmb3IgU2FmYXJpIG1hc2staWNvbiBsaW5rXG4gICAgICAgIGNvbG9yOiAwLFxuICAgICAgICAvLyBpdGVtUHJvcCwgaXRlbVNjb3BlLCBpdGVtVHlwZSBhcmUgZm9yXG4gICAgICAgIC8vIE1pY3JvZGF0YSBzdXBwb3J0LiBTZWUgaHR0cDovL3NjaGVtYS5vcmcvZG9jcy9ncy5odG1sXG4gICAgICAgIGl0ZW1Qcm9wOiAwLFxuICAgICAgICBpdGVtU2NvcGU6IEhBU19CT09MRUFOX1ZBTFVFLFxuICAgICAgICBpdGVtVHlwZTogMCxcbiAgICAgICAgLy8gaXRlbUlEIGFuZCBpdGVtUmVmIGFyZSBmb3IgTWljcm9kYXRhIHN1cHBvcnQgYXMgd2VsbCBidXRcbiAgICAgICAgLy8gb25seSBzcGVjaWZpZWQgaW4gdGhlIFdIQVRXRyBzcGVjIGRvY3VtZW50LiBTZWVcbiAgICAgICAgLy8gaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2UvbWljcm9kYXRhLmh0bWwjbWljcm9kYXRhLWRvbS1hcGlcbiAgICAgICAgaXRlbUlEOiAwLFxuICAgICAgICBpdGVtUmVmOiAwLFxuICAgICAgICAvLyByZXN1bHRzIHNob3cgbG9va2luZyBnbGFzcyBpY29uIGFuZCByZWNlbnQgc2VhcmNoZXMgb24gaW5wdXRcbiAgICAgICAgLy8gc2VhcmNoIGZpZWxkcyBpbiBXZWJLaXQvQmxpbmtcbiAgICAgICAgcmVzdWx0czogMCxcbiAgICAgICAgLy8gSUUtb25seSBhdHRyaWJ1dGUgdGhhdCBzcGVjaWZpZXMgc2VjdXJpdHkgcmVzdHJpY3Rpb25zIG9uIGFuIGlmcmFtZVxuICAgICAgICAvLyBhcyBhbiBhbHRlcm5hdGl2ZSB0byB0aGUgc2FuZGJveCBhdHRyaWJ1dGUgb24gSUU8MTBcbiAgICAgICAgc2VjdXJpdHk6IDAsXG4gICAgICAgIC8vIElFLW9ubHkgYXR0cmlidXRlIHRoYXQgY29udHJvbHMgZm9jdXMgYmVoYXZpb3JcbiAgICAgICAgdW5zZWxlY3RhYmxlOiAwXG4gICAgfSxcbiAgICBhdHRyTlM6IHt9LFxuICAgIGRvbUF0dHJzOiB7XG4gICAgICAgIGFjY2VwdENoYXJzZXQ6ICdhY2NlcHQtY2hhcnNldCcsXG4gICAgICAgIGNsYXNzTmFtZTogJ2NsYXNzJyxcbiAgICAgICAgaHRtbEZvcjogJ2ZvcicsXG4gICAgICAgIGh0dHBFcXVpdjogJ2h0dHAtZXF1aXYnXG4gICAgfSxcbiAgICBkb21Qcm9wczoge31cbn07XG5cbi8vIHN2ZyBjb25maWdcbnZhciB4bGluayA9ICdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJztcbnZhciB4bWwgPSAnaHR0cDovL3d3dy53My5vcmcvWE1MLzE5OTgvbmFtZXNwYWNlJztcblxuLy8gV2UgdXNlIGF0dHJpYnV0ZXMgZm9yIGV2ZXJ5dGhpbmcgU1ZHIHNvIGxldCdzIGF2b2lkIHNvbWUgZHVwbGljYXRpb24gYW5kIHJ1blxuLy8gY29kZSBpbnN0ZWFkLlxuLy8gVGhlIGZvbGxvd2luZyBhcmUgYWxsIHNwZWNpZmllZCBpbiB0aGUgSFRNTCBjb25maWcgYWxyZWFkeSBzbyB3ZSBleGNsdWRlIGhlcmUuXG4vLyAtIGNsYXNzIChhcyBjbGFzc05hbWUpXG4vLyAtIGNvbG9yXG4vLyAtIGhlaWdodFxuLy8gLSBpZFxuLy8gLSBsYW5nXG4vLyAtIG1heFxuLy8gLSBtZWRpYVxuLy8gLSBtZXRob2Rcbi8vIC0gbWluXG4vLyAtIG5hbWVcbi8vIC0gc3R5bGVcbi8vIC0gdGFyZ2V0XG4vLyAtIHR5cGVcbi8vIC0gd2lkdGhcbnZhciBBVFRSUyA9IHtcbiAgICBhY2NlbnRIZWlnaHQ6ICdhY2NlbnQtaGVpZ2h0JyxcbiAgICBhY2N1bXVsYXRlOiAwLFxuICAgIGFkZGl0aXZlOiAwLFxuICAgIGFsaWdubWVudEJhc2VsaW5lOiAnYWxpZ25tZW50LWJhc2VsaW5lJyxcbiAgICBhbGxvd1Jlb3JkZXI6ICdhbGxvd1Jlb3JkZXInLFxuICAgIGFscGhhYmV0aWM6IDAsXG4gICAgYW1wbGl0dWRlOiAwLFxuICAgIGFyYWJpY0Zvcm06ICdhcmFiaWMtZm9ybScsXG4gICAgYXNjZW50OiAwLFxuICAgIGF0dHJpYnV0ZU5hbWU6ICdhdHRyaWJ1dGVOYW1lJyxcbiAgICBhdHRyaWJ1dGVUeXBlOiAnYXR0cmlidXRlVHlwZScsXG4gICAgYXV0b1JldmVyc2U6ICdhdXRvUmV2ZXJzZScsXG4gICAgYXppbXV0aDogMCxcbiAgICBiYXNlRnJlcXVlbmN5OiAnYmFzZUZyZXF1ZW5jeScsXG4gICAgYmFzZVByb2ZpbGU6ICdiYXNlUHJvZmlsZScsXG4gICAgYmFzZWxpbmVTaGlmdDogJ2Jhc2VsaW5lLXNoaWZ0JyxcbiAgICBiYm94OiAwLFxuICAgIGJlZ2luOiAwLFxuICAgIGJpYXM6IDAsXG4gICAgYnk6IDAsXG4gICAgY2FsY01vZGU6ICdjYWxjTW9kZScsXG4gICAgY2FwSGVpZ2h0OiAnY2FwLWhlaWdodCcsXG4gICAgY2xpcDogMCxcbiAgICBjbGlwUGF0aDogJ2NsaXAtcGF0aCcsXG4gICAgY2xpcFJ1bGU6ICdjbGlwLXJ1bGUnLFxuICAgIGNsaXBQYXRoVW5pdHM6ICdjbGlwUGF0aFVuaXRzJyxcbiAgICBjb2xvckludGVycG9sYXRpb246ICdjb2xvci1pbnRlcnBvbGF0aW9uJyxcbiAgICBjb2xvckludGVycG9sYXRpb25GaWx0ZXJzOiAnY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzJyxcbiAgICBjb2xvclByb2ZpbGU6ICdjb2xvci1wcm9maWxlJyxcbiAgICBjb2xvclJlbmRlcmluZzogJ2NvbG9yLXJlbmRlcmluZycsXG4gICAgY29udGVudFNjcmlwdFR5cGU6ICdjb250ZW50U2NyaXB0VHlwZScsXG4gICAgY29udGVudFN0eWxlVHlwZTogJ2NvbnRlbnRTdHlsZVR5cGUnLFxuICAgIGN1cnNvcjogMCxcbiAgICBjeDogMCxcbiAgICBjeTogMCxcbiAgICBkOiAwLFxuICAgIGRlY2VsZXJhdGU6IDAsXG4gICAgZGVzY2VudDogMCxcbiAgICBkaWZmdXNlQ29uc3RhbnQ6ICdkaWZmdXNlQ29uc3RhbnQnLFxuICAgIGRpcmVjdGlvbjogMCxcbiAgICBkaXNwbGF5OiAwLFxuICAgIGRpdmlzb3I6IDAsXG4gICAgZG9taW5hbnRCYXNlbGluZTogJ2RvbWluYW50LWJhc2VsaW5lJyxcbiAgICBkdXI6IDAsXG4gICAgZHg6IDAsXG4gICAgZHk6IDAsXG4gICAgZWRnZU1vZGU6ICdlZGdlTW9kZScsXG4gICAgZWxldmF0aW9uOiAwLFxuICAgIGVuYWJsZUJhY2tncm91bmQ6ICdlbmFibGUtYmFja2dyb3VuZCcsXG4gICAgZW5kOiAwLFxuICAgIGV4cG9uZW50OiAwLFxuICAgIGV4dGVybmFsUmVzb3VyY2VzUmVxdWlyZWQ6ICdleHRlcm5hbFJlc291cmNlc1JlcXVpcmVkJyxcbiAgICBmaWxsOiAwLFxuICAgIGZpbGxPcGFjaXR5OiAnZmlsbC1vcGFjaXR5JyxcbiAgICBmaWxsUnVsZTogJ2ZpbGwtcnVsZScsXG4gICAgZmlsdGVyOiAwLFxuICAgIGZpbHRlclJlczogJ2ZpbHRlclJlcycsXG4gICAgZmlsdGVyVW5pdHM6ICdmaWx0ZXJVbml0cycsXG4gICAgZmxvb2RDb2xvcjogJ2Zsb29kLWNvbG9yJyxcbiAgICBmbG9vZE9wYWNpdHk6ICdmbG9vZC1vcGFjaXR5JyxcbiAgICBmb2N1c2FibGU6IDAsXG4gICAgZm9udEZhbWlseTogJ2ZvbnQtZmFtaWx5JyxcbiAgICBmb250U2l6ZTogJ2ZvbnQtc2l6ZScsXG4gICAgZm9udFNpemVBZGp1c3Q6ICdmb250LXNpemUtYWRqdXN0JyxcbiAgICBmb250U3RyZXRjaDogJ2ZvbnQtc3RyZXRjaCcsXG4gICAgZm9udFN0eWxlOiAnZm9udC1zdHlsZScsXG4gICAgZm9udFZhcmlhbnQ6ICdmb250LXZhcmlhbnQnLFxuICAgIGZvbnRXZWlnaHQ6ICdmb250LXdlaWdodCcsXG4gICAgZm9ybWF0OiAwLFxuICAgIGZyb206IDAsXG4gICAgZng6IDAsXG4gICAgZnk6IDAsXG4gICAgZzE6IDAsXG4gICAgZzI6IDAsXG4gICAgZ2x5cGhOYW1lOiAnZ2x5cGgtbmFtZScsXG4gICAgZ2x5cGhPcmllbnRhdGlvbkhvcml6b250YWw6ICdnbHlwaC1vcmllbnRhdGlvbi1ob3Jpem9udGFsJyxcbiAgICBnbHlwaE9yaWVudGF0aW9uVmVydGljYWw6ICdnbHlwaC1vcmllbnRhdGlvbi12ZXJ0aWNhbCcsXG4gICAgZ2x5cGhSZWY6ICdnbHlwaFJlZicsXG4gICAgZ3JhZGllbnRUcmFuc2Zvcm06ICdncmFkaWVudFRyYW5zZm9ybScsXG4gICAgZ3JhZGllbnRVbml0czogJ2dyYWRpZW50VW5pdHMnLFxuICAgIGhhbmdpbmc6IDAsXG4gICAgaG9yaXpBZHZYOiAnaG9yaXotYWR2LXgnLFxuICAgIGhvcml6T3JpZ2luWDogJ2hvcml6LW9yaWdpbi14JyxcbiAgICBpZGVvZ3JhcGhpYzogMCxcbiAgICBpbWFnZVJlbmRlcmluZzogJ2ltYWdlLXJlbmRlcmluZycsXG4gICAgJ2luJzogMCxcbiAgICBpbjI6IDAsXG4gICAgaW50ZXJjZXB0OiAwLFxuICAgIGs6IDAsXG4gICAgazE6IDAsXG4gICAgazI6IDAsXG4gICAgazM6IDAsXG4gICAgazQ6IDAsXG4gICAga2VybmVsTWF0cml4OiAna2VybmVsTWF0cml4JyxcbiAgICBrZXJuZWxVbml0TGVuZ3RoOiAna2VybmVsVW5pdExlbmd0aCcsXG4gICAga2VybmluZzogMCxcbiAgICBrZXlQb2ludHM6ICdrZXlQb2ludHMnLFxuICAgIGtleVNwbGluZXM6ICdrZXlTcGxpbmVzJyxcbiAgICBrZXlUaW1lczogJ2tleVRpbWVzJyxcbiAgICBsZW5ndGhBZGp1c3Q6ICdsZW5ndGhBZGp1c3QnLFxuICAgIGxldHRlclNwYWNpbmc6ICdsZXR0ZXItc3BhY2luZycsXG4gICAgbGlnaHRpbmdDb2xvcjogJ2xpZ2h0aW5nLWNvbG9yJyxcbiAgICBsaW1pdGluZ0NvbmVBbmdsZTogJ2xpbWl0aW5nQ29uZUFuZ2xlJyxcbiAgICBsb2NhbDogMCxcbiAgICBtYXJrZXJFbmQ6ICdtYXJrZXItZW5kJyxcbiAgICBtYXJrZXJNaWQ6ICdtYXJrZXItbWlkJyxcbiAgICBtYXJrZXJTdGFydDogJ21hcmtlci1zdGFydCcsXG4gICAgbWFya2VySGVpZ2h0OiAnbWFya2VySGVpZ2h0JyxcbiAgICBtYXJrZXJVbml0czogJ21hcmtlclVuaXRzJyxcbiAgICBtYXJrZXJXaWR0aDogJ21hcmtlcldpZHRoJyxcbiAgICBtYXNrOiAwLFxuICAgIG1hc2tDb250ZW50VW5pdHM6ICdtYXNrQ29udGVudFVuaXRzJyxcbiAgICBtYXNrVW5pdHM6ICdtYXNrVW5pdHMnLFxuICAgIG1hdGhlbWF0aWNhbDogMCxcbiAgICBtb2RlOiAwLFxuICAgIG51bU9jdGF2ZXM6ICdudW1PY3RhdmVzJyxcbiAgICBvZmZzZXQ6IDAsXG4gICAgb3BhY2l0eTogMCxcbiAgICBvcGVyYXRvcjogMCxcbiAgICBvcmRlcjogMCxcbiAgICBvcmllbnQ6IDAsXG4gICAgb3JpZW50YXRpb246IDAsXG4gICAgb3JpZ2luOiAwLFxuICAgIG92ZXJmbG93OiAwLFxuICAgIG92ZXJsaW5lUG9zaXRpb246ICdvdmVybGluZS1wb3NpdGlvbicsXG4gICAgb3ZlcmxpbmVUaGlja25lc3M6ICdvdmVybGluZS10aGlja25lc3MnLFxuICAgIHBhaW50T3JkZXI6ICdwYWludC1vcmRlcicsXG4gICAgcGFub3NlMTogJ3Bhbm9zZS0xJyxcbiAgICBwYXRoTGVuZ3RoOiAncGF0aExlbmd0aCcsXG4gICAgcGF0dGVybkNvbnRlbnRVbml0czogJ3BhdHRlcm5Db250ZW50VW5pdHMnLFxuICAgIHBhdHRlcm5UcmFuc2Zvcm06ICdwYXR0ZXJuVHJhbnNmb3JtJyxcbiAgICBwYXR0ZXJuVW5pdHM6ICdwYXR0ZXJuVW5pdHMnLFxuICAgIHBvaW50ZXJFdmVudHM6ICdwb2ludGVyLWV2ZW50cycsXG4gICAgcG9pbnRzOiAwLFxuICAgIHBvaW50c0F0WDogJ3BvaW50c0F0WCcsXG4gICAgcG9pbnRzQXRZOiAncG9pbnRzQXRZJyxcbiAgICBwb2ludHNBdFo6ICdwb2ludHNBdFonLFxuICAgIHByZXNlcnZlQWxwaGE6ICdwcmVzZXJ2ZUFscGhhJyxcbiAgICBwcmVzZXJ2ZUFzcGVjdFJhdGlvOiAncHJlc2VydmVBc3BlY3RSYXRpbycsXG4gICAgcHJpbWl0aXZlVW5pdHM6ICdwcmltaXRpdmVVbml0cycsXG4gICAgcjogMCxcbiAgICByYWRpdXM6IDAsXG4gICAgcmVmWDogJ3JlZlgnLFxuICAgIHJlZlk6ICdyZWZZJyxcbiAgICByZW5kZXJpbmdJbnRlbnQ6ICdyZW5kZXJpbmctaW50ZW50JyxcbiAgICByZXBlYXRDb3VudDogJ3JlcGVhdENvdW50JyxcbiAgICByZXBlYXREdXI6ICdyZXBlYXREdXInLFxuICAgIHJlcXVpcmVkRXh0ZW5zaW9uczogJ3JlcXVpcmVkRXh0ZW5zaW9ucycsXG4gICAgcmVxdWlyZWRGZWF0dXJlczogJ3JlcXVpcmVkRmVhdHVyZXMnLFxuICAgIHJlc3RhcnQ6IDAsXG4gICAgcmVzdWx0OiAwLFxuICAgIHJvdGF0ZTogMCxcbiAgICByeDogMCxcbiAgICByeTogMCxcbiAgICBzY2FsZTogMCxcbiAgICBzZWVkOiAwLFxuICAgIHNoYXBlUmVuZGVyaW5nOiAnc2hhcGUtcmVuZGVyaW5nJyxcbiAgICBzbG9wZTogMCxcbiAgICBzcGFjaW5nOiAwLFxuICAgIHNwZWN1bGFyQ29uc3RhbnQ6ICdzcGVjdWxhckNvbnN0YW50JyxcbiAgICBzcGVjdWxhckV4cG9uZW50OiAnc3BlY3VsYXJFeHBvbmVudCcsXG4gICAgc3BlZWQ6IDAsXG4gICAgc3ByZWFkTWV0aG9kOiAnc3ByZWFkTWV0aG9kJyxcbiAgICBzdGFydE9mZnNldDogJ3N0YXJ0T2Zmc2V0JyxcbiAgICBzdGREZXZpYXRpb246ICdzdGREZXZpYXRpb24nLFxuICAgIHN0ZW1oOiAwLFxuICAgIHN0ZW12OiAwLFxuICAgIHN0aXRjaFRpbGVzOiAnc3RpdGNoVGlsZXMnLFxuICAgIHN0b3BDb2xvcjogJ3N0b3AtY29sb3InLFxuICAgIHN0b3BPcGFjaXR5OiAnc3RvcC1vcGFjaXR5JyxcbiAgICBzdHJpa2V0aHJvdWdoUG9zaXRpb246ICdzdHJpa2V0aHJvdWdoLXBvc2l0aW9uJyxcbiAgICBzdHJpa2V0aHJvdWdoVGhpY2tuZXNzOiAnc3RyaWtldGhyb3VnaC10aGlja25lc3MnLFxuICAgIHN0cmluZzogMCxcbiAgICBzdHJva2U6IDAsXG4gICAgc3Ryb2tlRGFzaGFycmF5OiAnc3Ryb2tlLWRhc2hhcnJheScsXG4gICAgc3Ryb2tlRGFzaG9mZnNldDogJ3N0cm9rZS1kYXNob2Zmc2V0JyxcbiAgICBzdHJva2VMaW5lY2FwOiAnc3Ryb2tlLWxpbmVjYXAnLFxuICAgIHN0cm9rZUxpbmVqb2luOiAnc3Ryb2tlLWxpbmVqb2luJyxcbiAgICBzdHJva2VNaXRlcmxpbWl0OiAnc3Ryb2tlLW1pdGVybGltaXQnLFxuICAgIHN0cm9rZU9wYWNpdHk6ICdzdHJva2Utb3BhY2l0eScsXG4gICAgc3Ryb2tlV2lkdGg6ICdzdHJva2Utd2lkdGgnLFxuICAgIHN1cmZhY2VTY2FsZTogJ3N1cmZhY2VTY2FsZScsXG4gICAgc3lzdGVtTGFuZ3VhZ2U6ICdzeXN0ZW1MYW5ndWFnZScsXG4gICAgdGFibGVWYWx1ZXM6ICd0YWJsZVZhbHVlcycsXG4gICAgdGFyZ2V0WDogJ3RhcmdldFgnLFxuICAgIHRhcmdldFk6ICd0YXJnZXRZJyxcbiAgICB0ZXh0QW5jaG9yOiAndGV4dC1hbmNob3InLFxuICAgIHRleHREZWNvcmF0aW9uOiAndGV4dC1kZWNvcmF0aW9uJyxcbiAgICB0ZXh0UmVuZGVyaW5nOiAndGV4dC1yZW5kZXJpbmcnLFxuICAgIHRleHRMZW5ndGg6ICd0ZXh0TGVuZ3RoJyxcbiAgICB0bzogMCxcbiAgICB0cmFuc2Zvcm06IDAsXG4gICAgdTE6IDAsXG4gICAgdTI6IDAsXG4gICAgdW5kZXJsaW5lUG9zaXRpb246ICd1bmRlcmxpbmUtcG9zaXRpb24nLFxuICAgIHVuZGVybGluZVRoaWNrbmVzczogJ3VuZGVybGluZS10aGlja25lc3MnLFxuICAgIHVuaWNvZGU6IDAsXG4gICAgdW5pY29kZUJpZGk6ICd1bmljb2RlLWJpZGknLFxuICAgIHVuaWNvZGVSYW5nZTogJ3VuaWNvZGUtcmFuZ2UnLFxuICAgIHVuaXRzUGVyRW06ICd1bml0cy1wZXItZW0nLFxuICAgIHZBbHBoYWJldGljOiAndi1hbHBoYWJldGljJyxcbiAgICB2SGFuZ2luZzogJ3YtaGFuZ2luZycsXG4gICAgdklkZW9ncmFwaGljOiAndi1pZGVvZ3JhcGhpYycsXG4gICAgdk1hdGhlbWF0aWNhbDogJ3YtbWF0aGVtYXRpY2FsJyxcbiAgICB2YWx1ZXM6IDAsXG4gICAgdmVjdG9yRWZmZWN0OiAndmVjdG9yLWVmZmVjdCcsXG4gICAgdmVyc2lvbjogMCxcbiAgICB2ZXJ0QWR2WTogJ3ZlcnQtYWR2LXknLFxuICAgIHZlcnRPcmlnaW5YOiAndmVydC1vcmlnaW4teCcsXG4gICAgdmVydE9yaWdpblk6ICd2ZXJ0LW9yaWdpbi15JyxcbiAgICB2aWV3Qm94OiAndmlld0JveCcsXG4gICAgdmlld1RhcmdldDogJ3ZpZXdUYXJnZXQnLFxuICAgIHZpc2liaWxpdHk6IDAsXG4gICAgd2lkdGhzOiAwLFxuICAgIHdvcmRTcGFjaW5nOiAnd29yZC1zcGFjaW5nJyxcbiAgICB3cml0aW5nTW9kZTogJ3dyaXRpbmctbW9kZScsXG4gICAgeDogMCxcbiAgICB4SGVpZ2h0OiAneC1oZWlnaHQnLFxuICAgIHgxOiAwLFxuICAgIHgyOiAwLFxuICAgIHhDaGFubmVsU2VsZWN0b3I6ICd4Q2hhbm5lbFNlbGVjdG9yJyxcbiAgICB4bGlua0FjdHVhdGU6ICd4bGluazphY3R1YXRlJyxcbiAgICB4bGlua0FyY3JvbGU6ICd4bGluazphcmNyb2xlJyxcbiAgICB4bGlua0hyZWY6ICd4bGluazpocmVmJyxcbiAgICB4bGlua1JvbGU6ICd4bGluazpyb2xlJyxcbiAgICB4bGlua1Nob3c6ICd4bGluazpzaG93JyxcbiAgICB4bGlua1RpdGxlOiAneGxpbms6dGl0bGUnLFxuICAgIHhsaW5rVHlwZTogJ3hsaW5rOnR5cGUnLFxuICAgIHhtbEJhc2U6ICd4bWw6YmFzZScsXG4gICAgeG1sbnM6IDAsXG4gICAgeG1sbnNYbGluazogJ3htbG5zOnhsaW5rJyxcbiAgICB4bWxMYW5nOiAneG1sOmxhbmcnLFxuICAgIHhtbFNwYWNlOiAneG1sOnNwYWNlJyxcbiAgICB5OiAwLFxuICAgIHkxOiAwLFxuICAgIHkyOiAwLFxuICAgIHlDaGFubmVsU2VsZWN0b3I6ICd5Q2hhbm5lbFNlbGVjdG9yJyxcbiAgICB6OiAwLFxuICAgIHpvb21BbmRQYW46ICd6b29tQW5kUGFuJ1xufTtcblxudmFyIFNWR0RPTVByb3BlcnR5Q29uZmlnID0ge1xuICAgIHByb3BzOiB7fSxcbiAgICBhdHRyTlM6IHtcbiAgICAgICAgeGxpbmtBY3R1YXRlOiB4bGluayxcbiAgICAgICAgeGxpbmtBcmNyb2xlOiB4bGluayxcbiAgICAgICAgeGxpbmtIcmVmOiB4bGluayxcbiAgICAgICAgeGxpbmtSb2xlOiB4bGluayxcbiAgICAgICAgeGxpbmtTaG93OiB4bGluayxcbiAgICAgICAgeGxpbmtUaXRsZTogeGxpbmssXG4gICAgICAgIHhsaW5rVHlwZTogeGxpbmssXG4gICAgICAgIHhtbEJhc2U6IHhtbCxcbiAgICAgICAgeG1sTGFuZzogeG1sLFxuICAgICAgICB4bWxTcGFjZTogeG1sXG4gICAgfSxcbiAgICBkb21BdHRyczoge30sXG4gICAgZG9tUHJvcHM6IHt9XG59O1xuXG5PYmplY3Qua2V5cyhBVFRSUykubWFwKGZ1bmN0aW9uIChrZXkpIHtcbiAgICBTVkdET01Qcm9wZXJ0eUNvbmZpZy5wcm9wc1trZXldID0gMDtcbiAgICBpZiAoQVRUUlNba2V5XSkge1xuICAgICAgICBTVkdET01Qcm9wZXJ0eUNvbmZpZy5kb21BdHRyc1trZXldID0gQVRUUlNba2V5XTtcbiAgICB9XG59KTtcblxuLy8gbWVyZ2UgaHRtbCBhbmQgc3ZnIGNvbmZpZyBpbnRvIHByb3BlcnRpZXNcbm1lcmdlQ29uZmlnVG9Qcm9wZXJ0aWVzKEhUTUxET01Qcm9wZXJ0eUNvbmZpZyk7XG5tZXJnZUNvbmZpZ1RvUHJvcGVydGllcyhTVkdET01Qcm9wZXJ0eUNvbmZpZyk7XG5cbmZ1bmN0aW9uIG1lcmdlQ29uZmlnVG9Qcm9wZXJ0aWVzKGNvbmZpZykge1xuICAgIHZhclxuICAgIC8vIGFsbCByZWFjdC9yZWFjdC1saXRlIHN1cHBvcnRpbmcgcHJvcGVydHkgbmFtZXMgaW4gaGVyZVxuICAgIHByb3BzID0gY29uZmlnLnByb3BzO1xuICAgIHZhclxuICAgIC8vIGF0dHJpYnV0ZXMgbmFtZXNwYWNlIGluIGhlcmVcbiAgICBhdHRyTlMgPSBjb25maWcuYXR0ck5TO1xuICAgIHZhclxuICAgIC8vIHByb3BOYW1lIGluIHByb3BzIHdoaWNoIHNob3VsZCB1c2UgdG8gYmUgZG9tLWF0dHJpYnV0ZSBpbiBoZXJlXG4gICAgZG9tQXR0cnMgPSBjb25maWcuZG9tQXR0cnM7XG4gICAgdmFyXG4gICAgLy8gcHJvcE5hbWUgaW4gcHJvcHMgd2hpY2ggc2hvdWxkIHVzZSB0byBiZSBkb20tcHJvcGVydHkgaW4gaGVyZVxuICAgIGRvbVByb3BzID0gY29uZmlnLmRvbVByb3BzO1xuXG4gICAgZm9yICh2YXIgcHJvcE5hbWUgaW4gcHJvcHMpIHtcbiAgICAgICAgaWYgKCFwcm9wcy5oYXNPd25Qcm9wZXJ0eShwcm9wTmFtZSkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwcm9wQ29uZmlnID0gcHJvcHNbcHJvcE5hbWVdO1xuICAgICAgICBwcm9wZXJ0aWVzW3Byb3BOYW1lXSA9IHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZU5hbWU6IGRvbUF0dHJzLmhhc093blByb3BlcnR5KHByb3BOYW1lKSA/IGRvbUF0dHJzW3Byb3BOYW1lXSA6IHByb3BOYW1lLnRvTG93ZXJDYXNlKCksXG4gICAgICAgICAgICBwcm9wZXJ0eU5hbWU6IGRvbVByb3BzLmhhc093blByb3BlcnR5KHByb3BOYW1lKSA/IGRvbVByb3BzW3Byb3BOYW1lXSA6IHByb3BOYW1lLFxuICAgICAgICAgICAgYXR0cmlidXRlTmFtZXNwYWNlOiBhdHRyTlMuaGFzT3duUHJvcGVydHkocHJvcE5hbWUpID8gYXR0ck5TW3Byb3BOYW1lXSA6IG51bGwsXG4gICAgICAgICAgICBtdXN0VXNlUHJvcGVydHk6IGNoZWNrTWFzayhwcm9wQ29uZmlnLCBNVVNUX1VTRV9QUk9QRVJUWSksXG4gICAgICAgICAgICBoYXNCb29sZWFuVmFsdWU6IGNoZWNrTWFzayhwcm9wQ29uZmlnLCBIQVNfQk9PTEVBTl9WQUxVRSksXG4gICAgICAgICAgICBoYXNOdW1lcmljVmFsdWU6IGNoZWNrTWFzayhwcm9wQ29uZmlnLCBIQVNfTlVNRVJJQ19WQUxVRSksXG4gICAgICAgICAgICBoYXNQb3NpdGl2ZU51bWVyaWNWYWx1ZTogY2hlY2tNYXNrKHByb3BDb25maWcsIEhBU19QT1NJVElWRV9OVU1FUklDX1ZBTFVFKSxcbiAgICAgICAgICAgIGhhc092ZXJsb2FkZWRCb29sZWFuVmFsdWU6IGNoZWNrTWFzayhwcm9wQ29uZmlnLCBIQVNfT1ZFUkxPQURFRF9CT09MRUFOX1ZBTFVFKVxuICAgICAgICB9O1xuICAgIH1cbn1cblxuZnVuY3Rpb24gY2hlY2tNYXNrKHZhbHVlLCBiaXRtYXNrKSB7XG4gICAgcmV0dXJuICh2YWx1ZSAmIGJpdG1hc2spID09PSBiaXRtYXNrO1xufVxuXG4vKipcclxuICogU2V0cyB0aGUgdmFsdWUgZm9yIGEgcHJvcGVydHkgb24gYSBub2RlLlxyXG4gKlxyXG4gKiBAcGFyYW0ge0RPTUVsZW1lbnR9IG5vZGVcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHBhcmFtIHsqfSB2YWx1ZVxyXG4gKi9cblxuZnVuY3Rpb24gc2V0UHJvcFZhbHVlKG5vZGUsIG5hbWUsIHZhbHVlKSB7XG4gICAgdmFyIHByb3BJbmZvID0gcHJvcGVydGllcy5oYXNPd25Qcm9wZXJ0eShuYW1lKSAmJiBwcm9wZXJ0aWVzW25hbWVdO1xuICAgIGlmIChwcm9wSW5mbykge1xuICAgICAgICAvLyBzaG91bGQgZGVsZXRlIHZhbHVlIGZyb20gZG9tXG4gICAgICAgIGlmICh2YWx1ZSA9PSBudWxsIHx8IHByb3BJbmZvLmhhc0Jvb2xlYW5WYWx1ZSAmJiAhdmFsdWUgfHwgcHJvcEluZm8uaGFzTnVtZXJpY1ZhbHVlICYmIGlzTmFOKHZhbHVlKSB8fCBwcm9wSW5mby5oYXNQb3NpdGl2ZU51bWVyaWNWYWx1ZSAmJiB2YWx1ZSA8IDEgfHwgcHJvcEluZm8uaGFzT3ZlcmxvYWRlZEJvb2xlYW5WYWx1ZSAmJiB2YWx1ZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHJlbW92ZVByb3BWYWx1ZShub2RlLCBuYW1lKTtcbiAgICAgICAgfSBlbHNlIGlmIChwcm9wSW5mby5tdXN0VXNlUHJvcGVydHkpIHtcbiAgICAgICAgICAgIHZhciBwcm9wTmFtZSA9IHByb3BJbmZvLnByb3BlcnR5TmFtZTtcbiAgICAgICAgICAgIC8vIGRvbS52YWx1ZSBoYXMgc2lkZSBlZmZlY3RcbiAgICAgICAgICAgIGlmIChwcm9wTmFtZSAhPT0gJ3ZhbHVlJyB8fCAnJyArIG5vZGVbcHJvcE5hbWVdICE9PSAnJyArIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgbm9kZVtwcm9wTmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBhdHRyaWJ1dGVOYW1lID0gcHJvcEluZm8uYXR0cmlidXRlTmFtZTtcbiAgICAgICAgICAgIHZhciBuYW1lc3BhY2UgPSBwcm9wSW5mby5hdHRyaWJ1dGVOYW1lc3BhY2U7XG5cbiAgICAgICAgICAgIC8vIGBzZXRBdHRyaWJ1dGVgIHdpdGggb2JqZWN0cyBiZWNvbWVzIG9ubHkgYFtvYmplY3RdYCBpbiBJRTgvOSxcbiAgICAgICAgICAgIC8vICgnJyArIHZhbHVlKSBtYWtlcyBpdCBvdXRwdXQgdGhlIGNvcnJlY3QgdG9TdHJpbmcoKS12YWx1ZS5cbiAgICAgICAgICAgIGlmIChuYW1lc3BhY2UpIHtcbiAgICAgICAgICAgICAgICBub2RlLnNldEF0dHJpYnV0ZU5TKG5hbWVzcGFjZSwgYXR0cmlidXRlTmFtZSwgJycgKyB2YWx1ZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BJbmZvLmhhc0Jvb2xlYW5WYWx1ZSB8fCBwcm9wSW5mby5oYXNPdmVybG9hZGVkQm9vbGVhblZhbHVlICYmIHZhbHVlID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoYXR0cmlidXRlTmFtZSwgJycpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBub2RlLnNldEF0dHJpYnV0ZShhdHRyaWJ1dGVOYW1lLCAnJyArIHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaXNDdXN0b21BdHRyaWJ1dGUobmFtZSkgJiYgVkFMSURfQVRUUklCVVRFX05BTUVfUkVHRVgudGVzdChuYW1lKSkge1xuICAgICAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgICAgICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBub2RlLnNldEF0dHJpYnV0ZShuYW1lLCAnJyArIHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyoqXHJcbiAqIERlbGV0ZXMgdGhlIHZhbHVlIGZvciBhIHByb3BlcnR5IG9uIGEgbm9kZS5cclxuICpcclxuICogQHBhcmFtIHtET01FbGVtZW50fSBub2RlXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqL1xuXG5mdW5jdGlvbiByZW1vdmVQcm9wVmFsdWUobm9kZSwgbmFtZSkge1xuICAgIHZhciBwcm9wSW5mbyA9IHByb3BlcnRpZXMuaGFzT3duUHJvcGVydHkobmFtZSkgJiYgcHJvcGVydGllc1tuYW1lXTtcbiAgICBpZiAocHJvcEluZm8pIHtcbiAgICAgICAgaWYgKHByb3BJbmZvLm11c3RVc2VQcm9wZXJ0eSkge1xuICAgICAgICAgICAgdmFyIHByb3BOYW1lID0gcHJvcEluZm8ucHJvcGVydHlOYW1lO1xuICAgICAgICAgICAgaWYgKHByb3BJbmZvLmhhc0Jvb2xlYW5WYWx1ZSkge1xuICAgICAgICAgICAgICAgIG5vZGVbcHJvcE5hbWVdID0gZmFsc2U7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGRvbS52YWx1ZSBhY2NlcHQgc3RyaW5nIHZhbHVlIGhhcyBzaWRlIGVmZmVjdFxuICAgICAgICAgICAgICAgIGlmIChwcm9wTmFtZSAhPT0gJ3ZhbHVlJyB8fCAnJyArIG5vZGVbcHJvcE5hbWVdICE9PSAnJykge1xuICAgICAgICAgICAgICAgICAgICBub2RlW3Byb3BOYW1lXSA9ICcnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKHByb3BJbmZvLmF0dHJpYnV0ZU5hbWUpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmIChpc0N1c3RvbUF0dHJpYnV0ZShuYW1lKSkge1xuICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGlzRm4ob2JqKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBvYmogPT09ICdmdW5jdGlvbic7XG59XG5cbnZhciBpc0FyciA9IEFycmF5LmlzQXJyYXk7XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5mdW5jdGlvbiBpZGVudGl0eShvYmopIHtcbiAgICByZXR1cm4gb2JqO1xufVxuXG5mdW5jdGlvbiBwaXBlKGZuMSwgZm4yKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZm4xLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIHJldHVybiBmbjIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBhZGRJdGVtKGxpc3QsIGl0ZW0pIHtcbiAgICBsaXN0W2xpc3QubGVuZ3RoXSA9IGl0ZW07XG59XG5cbmZ1bmN0aW9uIGZsYXRFYWNoKGxpc3QsIGl0ZXJhdGVlLCBhKSB7XG4gICAgdmFyIGxlbiA9IGxpc3QubGVuZ3RoO1xuICAgIHZhciBpID0gLTE7XG5cbiAgICB3aGlsZSAobGVuLS0pIHtcbiAgICAgICAgdmFyIGl0ZW0gPSBsaXN0WysraV07XG4gICAgICAgIGlmIChpc0FycihpdGVtKSkge1xuICAgICAgICAgICAgZmxhdEVhY2goaXRlbSwgaXRlcmF0ZWUsIGEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaXRlcmF0ZWUoaXRlbSwgYSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGV4dGVuZCh0bywgZnJvbSkge1xuICAgIGlmICghZnJvbSkge1xuICAgICAgICByZXR1cm4gdG87XG4gICAgfVxuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMoZnJvbSk7XG4gICAgdmFyIGkgPSBrZXlzLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgIHRvW2tleXNbaV1dID0gZnJvbVtrZXlzW2ldXTtcbiAgICB9XG4gICAgcmV0dXJuIHRvO1xufVxuXG52YXIgdWlkID0gMDtcblxuZnVuY3Rpb24gZ2V0VWlkKCkge1xuICAgIHJldHVybiArK3VpZDtcbn1cblxudmFyIEVWRU5UX0tFWVMgPSAvXm9uL2k7XG5cbmZ1bmN0aW9uIHNldFByb3AoZWxlbSwga2V5LCB2YWx1ZSwgaXNDdXN0b21Db21wb25lbnQpIHtcbiAgICBpZiAoRVZFTlRfS0VZUy50ZXN0KGtleSkpIHtcbiAgICAgICAgYWRkRXZlbnQoZWxlbSwga2V5LCB2YWx1ZSk7XG4gICAgfSBlbHNlIGlmIChrZXkgPT09ICdzdHlsZScpIHtcbiAgICAgICAgc2V0U3R5bGUoZWxlbS5zdHlsZSwgdmFsdWUpO1xuICAgIH0gZWxzZSBpZiAoa2V5ID09PSBIVE1MX0tFWSkge1xuICAgICAgICBpZiAodmFsdWUgJiYgdmFsdWUuX19odG1sICE9IG51bGwpIHtcbiAgICAgICAgICAgIGVsZW0uaW5uZXJIVE1MID0gdmFsdWUuX19odG1sO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmIChpc0N1c3RvbUNvbXBvbmVudCkge1xuICAgICAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgICAgICAgZWxlbS5yZW1vdmVBdHRyaWJ1dGUoa2V5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVsZW0uc2V0QXR0cmlidXRlKGtleSwgJycgKyB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBzZXRQcm9wVmFsdWUoZWxlbSwga2V5LCB2YWx1ZSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiByZW1vdmVQcm9wKGVsZW0sIGtleSwgb2xkVmFsdWUsIGlzQ3VzdG9tQ29tcG9uZW50KSB7XG4gICAgaWYgKEVWRU5UX0tFWVMudGVzdChrZXkpKSB7XG4gICAgICAgIHJlbW92ZUV2ZW50KGVsZW0sIGtleSk7XG4gICAgfSBlbHNlIGlmIChrZXkgPT09ICdzdHlsZScpIHtcbiAgICAgICAgcmVtb3ZlU3R5bGUoZWxlbS5zdHlsZSwgb2xkVmFsdWUpO1xuICAgIH0gZWxzZSBpZiAoa2V5ID09PSBIVE1MX0tFWSkge1xuICAgICAgICBlbGVtLmlubmVySFRNTCA9ICcnO1xuICAgIH0gZWxzZSBpZiAoaXNDdXN0b21Db21wb25lbnQpIHtcbiAgICAgICAgZWxlbS5yZW1vdmVBdHRyaWJ1dGUoa2V5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZW1vdmVQcm9wVmFsdWUoZWxlbSwga2V5KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHBhdGNoUHJvcChlbGVtLCBrZXksIHZhbHVlLCBvbGRWYWx1ZSwgaXNDdXN0b21Db21wb25lbnQpIHtcbiAgICBpZiAoa2V5ID09PSAndmFsdWUnIHx8IGtleSA9PT0gJ2NoZWNrZWQnKSB7XG4gICAgICAgIG9sZFZhbHVlID0gZWxlbVtrZXldO1xuICAgIH1cbiAgICBpZiAodmFsdWUgPT09IG9sZFZhbHVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmVtb3ZlUHJvcChlbGVtLCBrZXksIG9sZFZhbHVlLCBpc0N1c3RvbUNvbXBvbmVudCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGtleSA9PT0gJ3N0eWxlJykge1xuICAgICAgICBwYXRjaFN0eWxlKGVsZW0uc3R5bGUsIG9sZFZhbHVlLCB2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc2V0UHJvcChlbGVtLCBrZXksIHZhbHVlLCBpc0N1c3RvbUNvbXBvbmVudCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzZXRQcm9wcyhlbGVtLCBwcm9wcywgaXNDdXN0b21Db21wb25lbnQpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gcHJvcHMpIHtcbiAgICAgICAgaWYgKGtleSAhPT0gJ2NoaWxkcmVuJykge1xuICAgICAgICAgICAgc2V0UHJvcChlbGVtLCBrZXksIHByb3BzW2tleV0sIGlzQ3VzdG9tQ29tcG9uZW50KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcGF0Y2hQcm9wcyhlbGVtLCBwcm9wcywgbmV3UHJvcHMsIGlzQ3VzdG9tQ29tcG9uZW50KSB7XG4gICAgZm9yICh2YXIga2V5IGluIHByb3BzKSB7XG4gICAgICAgIGlmIChrZXkgIT09ICdjaGlsZHJlbicpIHtcbiAgICAgICAgICAgIGlmIChuZXdQcm9wcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgcGF0Y2hQcm9wKGVsZW0sIGtleSwgbmV3UHJvcHNba2V5XSwgcHJvcHNba2V5XSwgaXNDdXN0b21Db21wb25lbnQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZW1vdmVQcm9wKGVsZW0sIGtleSwgcHJvcHNba2V5XSwgaXNDdXN0b21Db21wb25lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAodmFyIGtleSBpbiBuZXdQcm9wcykge1xuICAgICAgICBpZiAoa2V5ICE9PSAnY2hpbGRyZW4nICYmICFwcm9wcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICBzZXRQcm9wKGVsZW0sIGtleSwgbmV3UHJvcHNba2V5XSwgaXNDdXN0b21Db21wb25lbnQpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5pZiAoIU9iamVjdC5mcmVlemUpIHtcbiAgICBPYmplY3QuZnJlZXplID0gaWRlbnRpdHk7XG59XG5cbmZ1bmN0aW9uIGlzVmFsaWRDb250YWluZXIobm9kZSkge1xuXHRyZXR1cm4gISEobm9kZSAmJiAobm9kZS5ub2RlVHlwZSA9PT0gRUxFTUVOVF9OT0RFX1RZUEUgfHwgbm9kZS5ub2RlVHlwZSA9PT0gRE9DX05PREVfVFlQRSB8fCBub2RlLm5vZGVUeXBlID09PSBET0NVTUVOVF9GUkFHTUVOVF9OT0RFX1RZUEUpKTtcbn1cblxudmFyIHBlbmRpbmdSZW5kZXJpbmcgPSB7fTtcbnZhciB2bm9kZVN0b3JlID0ge307XG5mdW5jdGlvbiByZW5kZXJUcmVlSW50b0NvbnRhaW5lcih2bm9kZSwgY29udGFpbmVyLCBjYWxsYmFjaywgcGFyZW50Q29udGV4dCkge1xuXHRpZiAoIXZub2RlLnZ0eXBlKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCdjYW5ub3QgcmVuZGVyICcgKyB2bm9kZSArICcgdG8gY29udGFpbmVyJyk7XG5cdH1cblx0aWYgKCFpc1ZhbGlkQ29udGFpbmVyKGNvbnRhaW5lcikpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ2NvbnRhaW5lciAnICsgY29udGFpbmVyICsgJyBpcyBub3QgYSBET00gZWxlbWVudCcpO1xuXHR9XG5cdHZhciBpZCA9IGNvbnRhaW5lcltDT01QT05FTlRfSURdIHx8IChjb250YWluZXJbQ09NUE9ORU5UX0lEXSA9IGdldFVpZCgpKTtcblx0dmFyIGFyZ3NDYWNoZSA9IHBlbmRpbmdSZW5kZXJpbmdbaWRdO1xuXG5cdC8vIGNvbXBvbmVudCBsaWZ5IGN5Y2xlIG1ldGhvZCBtYXliZSBjYWxsIHJvb3QgcmVuZGVyaW5nXG5cdC8vIHNob3VsZCBidW5kbGUgdGhlbSBhbmQgcmVuZGVyIGJ5IG9ubHkgb25lIHRpbWVcblx0aWYgKGFyZ3NDYWNoZSkge1xuXHRcdGlmIChhcmdzQ2FjaGUgPT09IHRydWUpIHtcblx0XHRcdHBlbmRpbmdSZW5kZXJpbmdbaWRdID0gYXJnc0NhY2hlID0geyB2bm9kZTogdm5vZGUsIGNhbGxiYWNrOiBjYWxsYmFjaywgcGFyZW50Q29udGV4dDogcGFyZW50Q29udGV4dCB9O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRhcmdzQ2FjaGUudm5vZGUgPSB2bm9kZTtcblx0XHRcdGFyZ3NDYWNoZS5wYXJlbnRDb250ZXh0ID0gcGFyZW50Q29udGV4dDtcblx0XHRcdGFyZ3NDYWNoZS5jYWxsYmFjayA9IGFyZ3NDYWNoZS5jYWxsYmFjayA/IHBpcGUoYXJnc0NhY2hlLmNhbGxiYWNrLCBjYWxsYmFjaykgOiBjYWxsYmFjaztcblx0XHR9XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0cGVuZGluZ1JlbmRlcmluZ1tpZF0gPSB0cnVlO1xuXHR2YXIgb2xkVm5vZGUgPSBudWxsO1xuXHR2YXIgcm9vdE5vZGUgPSBudWxsO1xuXHRpZiAob2xkVm5vZGUgPSB2bm9kZVN0b3JlW2lkXSkge1xuXHRcdHJvb3ROb2RlID0gY29tcGFyZVR3b1Zub2RlcyhvbGRWbm9kZSwgdm5vZGUsIGNvbnRhaW5lci5maXJzdENoaWxkLCBwYXJlbnRDb250ZXh0KTtcblx0fSBlbHNlIHtcblx0XHRyb290Tm9kZSA9IGluaXRWbm9kZSh2bm9kZSwgcGFyZW50Q29udGV4dCwgY29udGFpbmVyLm5hbWVzcGFjZVVSSSk7XG5cdFx0dmFyIGNoaWxkTm9kZSA9IG51bGw7XG5cdFx0d2hpbGUgKGNoaWxkTm9kZSA9IGNvbnRhaW5lci5sYXN0Q2hpbGQpIHtcblx0XHRcdGNvbnRhaW5lci5yZW1vdmVDaGlsZChjaGlsZE5vZGUpO1xuXHRcdH1cblx0XHRjb250YWluZXIuYXBwZW5kQ2hpbGQocm9vdE5vZGUpO1xuXHR9XG5cdHZub2RlU3RvcmVbaWRdID0gdm5vZGU7XG5cdHZhciBpc1BlbmRpbmcgPSB1cGRhdGVRdWV1ZS5pc1BlbmRpbmc7XG5cdHVwZGF0ZVF1ZXVlLmlzUGVuZGluZyA9IHRydWU7XG5cdGNsZWFyUGVuZGluZygpO1xuXHRhcmdzQ2FjaGUgPSBwZW5kaW5nUmVuZGVyaW5nW2lkXTtcblx0ZGVsZXRlIHBlbmRpbmdSZW5kZXJpbmdbaWRdO1xuXG5cdHZhciByZXN1bHQgPSBudWxsO1xuXHRpZiAodHlwZW9mIGFyZ3NDYWNoZSA9PT0gJ29iamVjdCcpIHtcblx0XHRyZXN1bHQgPSByZW5kZXJUcmVlSW50b0NvbnRhaW5lcihhcmdzQ2FjaGUudm5vZGUsIGNvbnRhaW5lciwgYXJnc0NhY2hlLmNhbGxiYWNrLCBhcmdzQ2FjaGUucGFyZW50Q29udGV4dCk7XG5cdH0gZWxzZSBpZiAodm5vZGUudnR5cGUgPT09IFZFTEVNRU5UKSB7XG5cdFx0cmVzdWx0ID0gcm9vdE5vZGU7XG5cdH0gZWxzZSBpZiAodm5vZGUudnR5cGUgPT09IFZDT01QT05FTlQpIHtcblx0XHRyZXN1bHQgPSByb290Tm9kZS5jYWNoZVt2bm9kZS51aWRdO1xuXHR9XG5cblx0aWYgKCFpc1BlbmRpbmcpIHtcblx0XHR1cGRhdGVRdWV1ZS5pc1BlbmRpbmcgPSBmYWxzZTtcblx0XHR1cGRhdGVRdWV1ZS5iYXRjaFVwZGF0ZSgpO1xuXHR9XG5cblx0aWYgKGNhbGxiYWNrKSB7XG5cdFx0Y2FsbGJhY2suY2FsbChyZXN1bHQpO1xuXHR9XG5cblx0cmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gcmVuZGVyKHZub2RlLCBjb250YWluZXIsIGNhbGxiYWNrKSB7XG5cdHJldHVybiByZW5kZXJUcmVlSW50b0NvbnRhaW5lcih2bm9kZSwgY29udGFpbmVyLCBjYWxsYmFjayk7XG59XG5cbmZ1bmN0aW9uIHVuc3RhYmxlX3JlbmRlclN1YnRyZWVJbnRvQ29udGFpbmVyKHBhcmVudENvbXBvbmVudCwgc3ViVm5vZGUsIGNvbnRhaW5lciwgY2FsbGJhY2spIHtcblx0dmFyIGNvbnRleHQgPSBwYXJlbnRDb21wb25lbnQuJGNhY2hlLnBhcmVudENvbnRleHQ7XG5cdHJldHVybiByZW5kZXJUcmVlSW50b0NvbnRhaW5lcihzdWJWbm9kZSwgY29udGFpbmVyLCBjYWxsYmFjaywgY29udGV4dCk7XG59XG5cbmZ1bmN0aW9uIHVubW91bnRDb21wb25lbnRBdE5vZGUoY29udGFpbmVyKSB7XG5cdGlmICghY29udGFpbmVyLm5vZGVOYW1lKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCdleHBlY3Qgbm9kZScpO1xuXHR9XG5cdHZhciBpZCA9IGNvbnRhaW5lcltDT01QT05FTlRfSURdO1xuXHR2YXIgdm5vZGUgPSBudWxsO1xuXHRpZiAodm5vZGUgPSB2bm9kZVN0b3JlW2lkXSkge1xuXHRcdGRlc3Ryb3lWbm9kZSh2bm9kZSwgY29udGFpbmVyLmZpcnN0Q2hpbGQpO1xuXHRcdGNvbnRhaW5lci5yZW1vdmVDaGlsZChjb250YWluZXIuZmlyc3RDaGlsZCk7XG5cdFx0ZGVsZXRlIHZub2RlU3RvcmVbaWRdO1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cdHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gZmluZERPTU5vZGUobm9kZSkge1xuXHRpZiAobm9kZSA9PSBudWxsKSB7XG5cdFx0cmV0dXJuIG51bGw7XG5cdH1cblx0aWYgKG5vZGUubm9kZU5hbWUpIHtcblx0XHRyZXR1cm4gbm9kZTtcblx0fVxuXHR2YXIgY29tcG9uZW50ID0gbm9kZTtcblx0Ly8gaWYgY29tcG9uZW50Lm5vZGUgZXF1YWwgdG8gZmFsc2UsIGNvbXBvbmVudCBtdXN0IGJlIHVubW91bnRlZFxuXHRpZiAoY29tcG9uZW50LmdldERPTU5vZGUgJiYgY29tcG9uZW50LiRjYWNoZS5pc01vdW50ZWQpIHtcblx0XHRyZXR1cm4gY29tcG9uZW50LmdldERPTU5vZGUoKTtcblx0fVxuXHR0aHJvdyBuZXcgRXJyb3IoJ2ZpbmRET01Ob2RlIGNhbiBub3QgZmluZCBOb2RlJyk7XG59XG5cbnZhciBSZWFjdERPTSA9IE9iamVjdC5mcmVlemUoe1xuXHRyZW5kZXI6IHJlbmRlcixcblx0dW5zdGFibGVfcmVuZGVyU3VidHJlZUludG9Db250YWluZXI6IHVuc3RhYmxlX3JlbmRlclN1YnRyZWVJbnRvQ29udGFpbmVyLFxuXHR1bm1vdW50Q29tcG9uZW50QXROb2RlOiB1bm1vdW50Q29tcG9uZW50QXROb2RlLFxuXHRmaW5kRE9NTm9kZTogZmluZERPTU5vZGVcbn0pO1xuXG5mdW5jdGlvbiBjcmVhdGVFbGVtZW50KHR5cGUsIHByb3BzLCBjaGlsZHJlbikge1xuXHR2YXIgdnR5cGUgPSBudWxsO1xuXHRpZiAodHlwZW9mIHR5cGUgPT09ICdzdHJpbmcnKSB7XG5cdFx0dnR5cGUgPSBWRUxFTUVOVDtcblx0fSBlbHNlIGlmICh0eXBlb2YgdHlwZSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdGlmICh0eXBlLnByb3RvdHlwZSAmJiB0eXBlLnByb3RvdHlwZS5pc1JlYWN0Q29tcG9uZW50KSB7XG5cdFx0XHR2dHlwZSA9IFZDT01QT05FTlQ7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHZ0eXBlID0gVlNUQVRFTEVTUztcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCdSZWFjdC5jcmVhdGVFbGVtZW50OiB1bmV4cGVjdCB0eXBlIFsgJyArIHR5cGUgKyAnIF0nKTtcblx0fVxuXG5cdHZhciBrZXkgPSBudWxsO1xuXHR2YXIgcmVmID0gbnVsbDtcblx0dmFyIGZpbmFsUHJvcHMgPSB7fTtcblx0aWYgKHByb3BzICE9IG51bGwpIHtcblx0XHRmb3IgKHZhciBwcm9wS2V5IGluIHByb3BzKSB7XG5cdFx0XHRpZiAoIXByb3BzLmhhc093blByb3BlcnR5KHByb3BLZXkpKSB7XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHByb3BLZXkgPT09ICdrZXknKSB7XG5cdFx0XHRcdGlmIChwcm9wcy5rZXkgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdGtleSA9ICcnICsgcHJvcHMua2V5O1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKHByb3BLZXkgPT09ICdyZWYnKSB7XG5cdFx0XHRcdGlmIChwcm9wcy5yZWYgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdHJlZiA9IHByb3BzLnJlZjtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZmluYWxQcm9wc1twcm9wS2V5XSA9IHByb3BzW3Byb3BLZXldO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHZhciBkZWZhdWx0UHJvcHMgPSB0eXBlLmRlZmF1bHRQcm9wcztcblxuXHRpZiAoZGVmYXVsdFByb3BzKSB7XG5cdFx0Zm9yICh2YXIgcHJvcEtleSBpbiBkZWZhdWx0UHJvcHMpIHtcblx0XHRcdGlmIChmaW5hbFByb3BzW3Byb3BLZXldID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0ZmluYWxQcm9wc1twcm9wS2V5XSA9IGRlZmF1bHRQcm9wc1twcm9wS2V5XTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHR2YXIgYXJnc0xlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG5cdHZhciBmaW5hbENoaWxkcmVuID0gY2hpbGRyZW47XG5cblx0aWYgKGFyZ3NMZW4gPiAzKSB7XG5cdFx0ZmluYWxDaGlsZHJlbiA9IEFycmF5KGFyZ3NMZW4gLSAyKTtcblx0XHRmb3IgKHZhciBpID0gMjsgaSA8IGFyZ3NMZW47IGkrKykge1xuXHRcdFx0ZmluYWxDaGlsZHJlbltpIC0gMl0gPSBhcmd1bWVudHNbaV07XG5cdFx0fVxuXHR9XG5cblx0aWYgKGZpbmFsQ2hpbGRyZW4gIT09IHVuZGVmaW5lZCkge1xuXHRcdGZpbmFsUHJvcHMuY2hpbGRyZW4gPSBmaW5hbENoaWxkcmVuO1xuXHR9XG5cblx0cmV0dXJuIGNyZWF0ZVZub2RlKHZ0eXBlLCB0eXBlLCBmaW5hbFByb3BzLCBrZXksIHJlZik7XG59XG5cbmZ1bmN0aW9uIGlzVmFsaWRFbGVtZW50KG9iaikge1xuXHRyZXR1cm4gb2JqICE9IG51bGwgJiYgISFvYmoudnR5cGU7XG59XG5cbmZ1bmN0aW9uIGNsb25lRWxlbWVudChvcmlnaW5FbGVtLCBwcm9wcykge1xuXHR2YXIgdHlwZSA9IG9yaWdpbkVsZW0udHlwZTtcblx0dmFyIGtleSA9IG9yaWdpbkVsZW0ua2V5O1xuXHR2YXIgcmVmID0gb3JpZ2luRWxlbS5yZWY7XG5cblx0dmFyIG5ld1Byb3BzID0gZXh0ZW5kKGV4dGVuZCh7IGtleToga2V5LCByZWY6IHJlZiB9LCBvcmlnaW5FbGVtLnByb3BzKSwgcHJvcHMpO1xuXG5cdGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBjaGlsZHJlbiA9IEFycmF5KF9sZW4gPiAyID8gX2xlbiAtIDIgOiAwKSwgX2tleSA9IDI7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcblx0XHRjaGlsZHJlbltfa2V5IC0gMl0gPSBhcmd1bWVudHNbX2tleV07XG5cdH1cblxuXHR2YXIgdm5vZGUgPSBjcmVhdGVFbGVtZW50LmFwcGx5KHVuZGVmaW5lZCwgW3R5cGUsIG5ld1Byb3BzXS5jb25jYXQoY2hpbGRyZW4pKTtcblx0aWYgKHZub2RlLnJlZiA9PT0gb3JpZ2luRWxlbS5yZWYpIHtcblx0XHR2bm9kZS5yZWZzID0gb3JpZ2luRWxlbS5yZWZzO1xuXHR9XG5cdHJldHVybiB2bm9kZTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlRmFjdG9yeSh0eXBlKSB7XG5cdHZhciBmYWN0b3J5ID0gZnVuY3Rpb24gZmFjdG9yeSgpIHtcblx0XHRmb3IgKHZhciBfbGVuMiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBBcnJheShfbGVuMiksIF9rZXkyID0gMDsgX2tleTIgPCBfbGVuMjsgX2tleTIrKykge1xuXHRcdFx0YXJnc1tfa2V5Ml0gPSBhcmd1bWVudHNbX2tleTJdO1xuXHRcdH1cblxuXHRcdHJldHVybiBjcmVhdGVFbGVtZW50LmFwcGx5KHVuZGVmaW5lZCwgW3R5cGVdLmNvbmNhdChhcmdzKSk7XG5cdH07XG5cdGZhY3RvcnkudHlwZSA9IHR5cGU7XG5cdHJldHVybiBmYWN0b3J5O1xufVxuXG52YXIgdGFnTmFtZXMgPSAnYXxhYmJyfGFkZHJlc3N8YXJlYXxhcnRpY2xlfGFzaWRlfGF1ZGlvfGJ8YmFzZXxiZGl8YmRvfGJpZ3xibG9ja3F1b3RlfGJvZHl8YnJ8YnV0dG9ufGNhbnZhc3xjYXB0aW9ufGNpdGV8Y29kZXxjb2x8Y29sZ3JvdXB8ZGF0YXxkYXRhbGlzdHxkZHxkZWx8ZGV0YWlsc3xkZm58ZGlhbG9nfGRpdnxkbHxkdHxlbXxlbWJlZHxmaWVsZHNldHxmaWdjYXB0aW9ufGZpZ3VyZXxmb290ZXJ8Zm9ybXxoMXxoMnxoM3xoNHxoNXxoNnxoZWFkfGhlYWRlcnxoZ3JvdXB8aHJ8aHRtbHxpfGlmcmFtZXxpbWd8aW5wdXR8aW5zfGtiZHxrZXlnZW58bGFiZWx8bGVnZW5kfGxpfGxpbmt8bWFpbnxtYXB8bWFya3xtZW51fG1lbnVpdGVtfG1ldGF8bWV0ZXJ8bmF2fG5vc2NyaXB0fG9iamVjdHxvbHxvcHRncm91cHxvcHRpb258b3V0cHV0fHB8cGFyYW18cGljdHVyZXxwcmV8cHJvZ3Jlc3N8cXxycHxydHxydWJ5fHN8c2FtcHxzY3JpcHR8c2VjdGlvbnxzZWxlY3R8c21hbGx8c291cmNlfHNwYW58c3Ryb25nfHN0eWxlfHN1YnxzdW1tYXJ5fHN1cHx0YWJsZXx0Ym9keXx0ZHx0ZXh0YXJlYXx0Zm9vdHx0aHx0aGVhZHx0aW1lfHRpdGxlfHRyfHRyYWNrfHV8dWx8dmFyfHZpZGVvfHdicnxjaXJjbGV8Y2xpcFBhdGh8ZGVmc3xlbGxpcHNlfGd8aW1hZ2V8bGluZXxsaW5lYXJHcmFkaWVudHxtYXNrfHBhdGh8cGF0dGVybnxwb2x5Z29ufHBvbHlsaW5lfHJhZGlhbEdyYWRpZW50fHJlY3R8c3RvcHxzdmd8dGV4dHx0c3Bhbic7XG52YXIgRE9NID0ge307XG50YWdOYW1lcy5zcGxpdCgnfCcpLmZvckVhY2goZnVuY3Rpb24gKHRhZ05hbWUpIHtcblx0RE9NW3RhZ05hbWVdID0gY3JlYXRlRmFjdG9yeSh0YWdOYW1lKTtcbn0pO1xuXG52YXIgY2hlY2sgPSBmdW5jdGlvbiBjaGVjaygpIHtcbiAgICByZXR1cm4gY2hlY2s7XG59O1xuY2hlY2suaXNSZXF1aXJlZCA9IGNoZWNrO1xudmFyIFByb3BUeXBlcyA9IHtcbiAgICBcImFycmF5XCI6IGNoZWNrLFxuICAgIFwiYm9vbFwiOiBjaGVjayxcbiAgICBcImZ1bmNcIjogY2hlY2ssXG4gICAgXCJudW1iZXJcIjogY2hlY2ssXG4gICAgXCJvYmplY3RcIjogY2hlY2ssXG4gICAgXCJzdHJpbmdcIjogY2hlY2ssXG4gICAgXCJhbnlcIjogY2hlY2ssXG4gICAgXCJhcnJheU9mXCI6IGNoZWNrLFxuICAgIFwiZWxlbWVudFwiOiBjaGVjayxcbiAgICBcImluc3RhbmNlT2ZcIjogY2hlY2ssXG4gICAgXCJub2RlXCI6IGNoZWNrLFxuICAgIFwib2JqZWN0T2ZcIjogY2hlY2ssXG4gICAgXCJvbmVPZlwiOiBjaGVjayxcbiAgICBcIm9uZU9mVHlwZVwiOiBjaGVjayxcbiAgICBcInNoYXBlXCI6IGNoZWNrXG59O1xuXG5mdW5jdGlvbiBvbmx5KGNoaWxkcmVuKSB7XG5cdGlmIChpc1ZhbGlkRWxlbWVudChjaGlsZHJlbikpIHtcblx0XHRyZXR1cm4gY2hpbGRyZW47XG5cdH1cblx0dGhyb3cgbmV3IEVycm9yKCdleHBlY3Qgb25seSBvbmUgY2hpbGQnKTtcbn1cblxuZnVuY3Rpb24gZm9yRWFjaChjaGlsZHJlbiwgaXRlcmF0ZWUsIGNvbnRleHQpIHtcblx0aWYgKGNoaWxkcmVuID09IG51bGwpIHtcblx0XHRyZXR1cm4gY2hpbGRyZW47XG5cdH1cblx0dmFyIGluZGV4ID0gMDtcblx0aWYgKGlzQXJyKGNoaWxkcmVuKSkge1xuXHRcdGZsYXRFYWNoKGNoaWxkcmVuLCBmdW5jdGlvbiAoY2hpbGQpIHtcblx0XHRcdGl0ZXJhdGVlLmNhbGwoY29udGV4dCwgY2hpbGQsIGluZGV4KyspO1xuXHRcdH0pO1xuXHR9IGVsc2Uge1xuXHRcdGl0ZXJhdGVlLmNhbGwoY29udGV4dCwgY2hpbGRyZW4sIGluZGV4KTtcblx0fVxufVxuXG5mdW5jdGlvbiBtYXAoY2hpbGRyZW4sIGl0ZXJhdGVlLCBjb250ZXh0KSB7XG5cdGlmIChjaGlsZHJlbiA9PSBudWxsKSB7XG5cdFx0cmV0dXJuIGNoaWxkcmVuO1xuXHR9XG5cdHZhciBzdG9yZSA9IFtdO1xuXHR2YXIga2V5TWFwID0ge307XG5cdGZvckVhY2goY2hpbGRyZW4sIGZ1bmN0aW9uIChjaGlsZCwgaW5kZXgpIHtcblx0XHR2YXIgZGF0YSA9IHt9O1xuXHRcdGRhdGEuY2hpbGQgPSBpdGVyYXRlZS5jYWxsKGNvbnRleHQsIGNoaWxkLCBpbmRleCkgfHwgY2hpbGQ7XG5cdFx0ZGF0YS5pc0VxdWFsID0gZGF0YS5jaGlsZCA9PT0gY2hpbGQ7XG5cdFx0dmFyIGtleSA9IGRhdGEua2V5ID0gZ2V0S2V5KGNoaWxkLCBpbmRleCk7XG5cdFx0aWYgKGtleU1hcC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG5cdFx0XHRrZXlNYXBba2V5XSArPSAxO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRrZXlNYXBba2V5XSA9IDA7XG5cdFx0fVxuXHRcdGRhdGEuaW5kZXggPSBrZXlNYXBba2V5XTtcblx0XHRhZGRJdGVtKHN0b3JlLCBkYXRhKTtcblx0fSk7XG5cdHZhciByZXN1bHQgPSBbXTtcblx0c3RvcmUuZm9yRWFjaChmdW5jdGlvbiAoX3JlZikge1xuXHRcdHZhciBjaGlsZCA9IF9yZWYuY2hpbGQ7XG5cdFx0dmFyIGtleSA9IF9yZWYua2V5O1xuXHRcdHZhciBpbmRleCA9IF9yZWYuaW5kZXg7XG5cdFx0dmFyIGlzRXF1YWwgPSBfcmVmLmlzRXF1YWw7XG5cblx0XHRpZiAoY2hpbGQgPT0gbnVsbCB8fCB0eXBlb2YgY2hpbGQgPT09ICdib29sZWFuJykge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRpZiAoIWlzVmFsaWRFbGVtZW50KGNoaWxkKSB8fCBrZXkgPT0gbnVsbCkge1xuXHRcdFx0YWRkSXRlbShyZXN1bHQsIGNoaWxkKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0aWYgKGtleU1hcFtrZXldICE9PSAwKSB7XG5cdFx0XHRrZXkgKz0gJzonICsgaW5kZXg7XG5cdFx0fVxuXHRcdGlmICghaXNFcXVhbCkge1xuXHRcdFx0a2V5ID0gZXNjYXBlVXNlclByb3ZpZGVkS2V5KGNoaWxkLmtleSB8fCAnJykgKyAnLycgKyBrZXk7XG5cdFx0fVxuXHRcdGNoaWxkID0gY2xvbmVFbGVtZW50KGNoaWxkLCB7IGtleToga2V5IH0pO1xuXHRcdGFkZEl0ZW0ocmVzdWx0LCBjaGlsZCk7XG5cdH0pO1xuXHRyZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBjb3VudChjaGlsZHJlbikge1xuXHR2YXIgY291bnQgPSAwO1xuXHRmb3JFYWNoKGNoaWxkcmVuLCBmdW5jdGlvbiAoKSB7XG5cdFx0Y291bnQrKztcblx0fSk7XG5cdHJldHVybiBjb3VudDtcbn1cblxuZnVuY3Rpb24gdG9BcnJheShjaGlsZHJlbikge1xuXHRyZXR1cm4gbWFwKGNoaWxkcmVuLCBpZGVudGl0eSkgfHwgW107XG59XG5cbmZ1bmN0aW9uIGdldEtleShjaGlsZCwgaW5kZXgpIHtcblx0dmFyIGtleSA9IHVuZGVmaW5lZDtcblx0aWYgKGlzVmFsaWRFbGVtZW50KGNoaWxkKSAmJiB0eXBlb2YgY2hpbGQua2V5ID09PSAnc3RyaW5nJykge1xuXHRcdGtleSA9ICcuJCcgKyBjaGlsZC5rZXk7XG5cdH0gZWxzZSB7XG5cdFx0a2V5ID0gJy4nICsgaW5kZXgudG9TdHJpbmcoMzYpO1xuXHR9XG5cdHJldHVybiBrZXk7XG59XG5cbnZhciB1c2VyUHJvdmlkZWRLZXlFc2NhcGVSZWdleCA9IC9cXC8oPyFcXC8pL2c7XG5mdW5jdGlvbiBlc2NhcGVVc2VyUHJvdmlkZWRLZXkodGV4dCkge1xuXHRyZXR1cm4gKCcnICsgdGV4dCkucmVwbGFjZSh1c2VyUHJvdmlkZWRLZXlFc2NhcGVSZWdleCwgJy8vJyk7XG59XG5cbnZhciBDaGlsZHJlbiA9IE9iamVjdC5mcmVlemUoe1xuXHRvbmx5OiBvbmx5LFxuXHRmb3JFYWNoOiBmb3JFYWNoLFxuXHRtYXA6IG1hcCxcblx0Y291bnQ6IGNvdW50LFxuXHR0b0FycmF5OiB0b0FycmF5XG59KTtcblxuZnVuY3Rpb24gZWFjaE1peGluKG1peGlucywgaXRlcmF0ZWUpIHtcblx0bWl4aW5zLmZvckVhY2goZnVuY3Rpb24gKG1peGluKSB7XG5cdFx0aWYgKG1peGluKSB7XG5cdFx0XHRpZiAoaXNBcnIobWl4aW4ubWl4aW5zKSkge1xuXHRcdFx0XHRlYWNoTWl4aW4obWl4aW4ubWl4aW5zLCBpdGVyYXRlZSk7XG5cdFx0XHR9XG5cdFx0XHRpdGVyYXRlZShtaXhpbik7XG5cdFx0fVxuXHR9KTtcbn1cblxuZnVuY3Rpb24gY29tYmluZU1peGluVG9Qcm90byhwcm90bywgbWl4aW4pIHtcblx0Zm9yICh2YXIga2V5IGluIG1peGluKSB7XG5cdFx0aWYgKCFtaXhpbi5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG5cdFx0XHRjb250aW51ZTtcblx0XHR9XG5cdFx0dmFyIHZhbHVlID0gbWl4aW5ba2V5XTtcblx0XHRpZiAoa2V5ID09PSAnZ2V0SW5pdGlhbFN0YXRlJykge1xuXHRcdFx0YWRkSXRlbShwcm90by4kZ2V0SW5pdGlhbFN0YXRlcywgdmFsdWUpO1xuXHRcdFx0Y29udGludWU7XG5cdFx0fVxuXHRcdHZhciBjdXJWYWx1ZSA9IHByb3RvW2tleV07XG5cdFx0aWYgKGlzRm4oY3VyVmFsdWUpICYmIGlzRm4odmFsdWUpKSB7XG5cdFx0XHRwcm90b1trZXldID0gcGlwZShjdXJWYWx1ZSwgdmFsdWUpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRwcm90b1trZXldID0gdmFsdWU7XG5cdFx0fVxuXHR9XG59XG5cbmZ1bmN0aW9uIGNvbWJpbmVNaXhpblRvQ2xhc3MoQ29tcG9uZW50LCBtaXhpbikge1xuXHRpZiAobWl4aW4ucHJvcFR5cGVzKSB7XG5cdFx0Q29tcG9uZW50LnByb3BUeXBlcyA9IENvbXBvbmVudC5wcm9wVHlwZXMgfHwge307XG5cdFx0ZXh0ZW5kKENvbXBvbmVudC5wcm9wVHlwZXMsIG1peGluLnByb3BUeXBlcyk7XG5cdH1cblx0aWYgKG1peGluLmNvbnRleHRUeXBlcykge1xuXHRcdENvbXBvbmVudC5jb250ZXh0VHlwZXMgPSBDb21wb25lbnQuY29udGV4dFR5cGVzIHx8IHt9O1xuXHRcdGV4dGVuZChDb21wb25lbnQuY29udGV4dFR5cGVzLCBtaXhpbi5jb250ZXh0VHlwZXMpO1xuXHR9XG5cdGV4dGVuZChDb21wb25lbnQsIG1peGluLnN0YXRpY3MpO1xuXHRpZiAoaXNGbihtaXhpbi5nZXREZWZhdWx0UHJvcHMpKSB7XG5cdFx0Q29tcG9uZW50LmRlZmF1bHRQcm9wcyA9IENvbXBvbmVudC5kZWZhdWx0UHJvcHMgfHwge307XG5cdFx0ZXh0ZW5kKENvbXBvbmVudC5kZWZhdWx0UHJvcHMsIG1peGluLmdldERlZmF1bHRQcm9wcygpKTtcblx0fVxufVxuXG5mdW5jdGlvbiBiaW5kQ29udGV4dChvYmosIHNvdXJjZSkge1xuXHRmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7XG5cdFx0aWYgKHNvdXJjZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG5cdFx0XHRpZiAoaXNGbihzb3VyY2Vba2V5XSkpIHtcblx0XHRcdFx0b2JqW2tleV0gPSBzb3VyY2Vba2V5XS5iaW5kKG9iaik7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59XG5cbnZhciBGYWNhZGUgPSBmdW5jdGlvbiBGYWNhZGUoKSB7fTtcbkZhY2FkZS5wcm90b3R5cGUgPSBDb21wb25lbnQucHJvdG90eXBlO1xuXG5mdW5jdGlvbiBnZXRJbml0aWFsU3RhdGUoKSB7XG5cdHZhciBfdGhpcyA9IHRoaXM7XG5cblx0dmFyIHN0YXRlID0ge307XG5cdHZhciBzZXRTdGF0ZSA9IHRoaXMuc2V0U3RhdGU7XG5cdHRoaXMuc2V0U3RhdGUgPSBGYWNhZGU7XG5cdHRoaXMuJGdldEluaXRpYWxTdGF0ZXMuZm9yRWFjaChmdW5jdGlvbiAoZ2V0SW5pdGlhbFN0YXRlKSB7XG5cdFx0aWYgKGlzRm4oZ2V0SW5pdGlhbFN0YXRlKSkge1xuXHRcdFx0ZXh0ZW5kKHN0YXRlLCBnZXRJbml0aWFsU3RhdGUuY2FsbChfdGhpcykpO1xuXHRcdH1cblx0fSk7XG5cdHRoaXMuc2V0U3RhdGUgPSBzZXRTdGF0ZTtcblx0cmV0dXJuIHN0YXRlO1xufVxuZnVuY3Rpb24gY3JlYXRlQ2xhc3Moc3BlYykge1xuXHRpZiAoIWlzRm4oc3BlYy5yZW5kZXIpKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCdjcmVhdGVDbGFzczogc3BlYy5yZW5kZXIgaXMgbm90IGZ1bmN0aW9uJyk7XG5cdH1cblx0dmFyIHNwZWNNaXhpbnMgPSBzcGVjLm1peGlucyB8fCBbXTtcblx0dmFyIG1peGlucyA9IHNwZWNNaXhpbnMuY29uY2F0KHNwZWMpO1xuXHRzcGVjLm1peGlucyA9IG51bGw7XG5cdGZ1bmN0aW9uIEtsYXNzKHByb3BzLCBjb250ZXh0KSB7XG5cdFx0Q29tcG9uZW50LmNhbGwodGhpcywgcHJvcHMsIGNvbnRleHQpO1xuXHRcdHRoaXMuY29uc3RydWN0b3IgPSBLbGFzcztcblx0XHRzcGVjLmF1dG9iaW5kICE9PSBmYWxzZSAmJiBiaW5kQ29udGV4dCh0aGlzLCBLbGFzcy5wcm90b3R5cGUpO1xuXHRcdHRoaXMuc3RhdGUgPSB0aGlzLmdldEluaXRpYWxTdGF0ZSgpIHx8IHRoaXMuc3RhdGU7XG5cdH1cblx0S2xhc3MuZGlzcGxheU5hbWUgPSBzcGVjLmRpc3BsYXlOYW1lO1xuXHR2YXIgcHJvdG8gPSBLbGFzcy5wcm90b3R5cGUgPSBuZXcgRmFjYWRlKCk7XG5cdHByb3RvLiRnZXRJbml0aWFsU3RhdGVzID0gW107XG5cdGVhY2hNaXhpbihtaXhpbnMsIGZ1bmN0aW9uIChtaXhpbikge1xuXHRcdGNvbWJpbmVNaXhpblRvUHJvdG8ocHJvdG8sIG1peGluKTtcblx0XHRjb21iaW5lTWl4aW5Ub0NsYXNzKEtsYXNzLCBtaXhpbik7XG5cdH0pO1xuXHRwcm90by5nZXRJbml0aWFsU3RhdGUgPSBnZXRJbml0aWFsU3RhdGU7XG5cdHNwZWMubWl4aW5zID0gc3BlY01peGlucztcblx0cmV0dXJuIEtsYXNzO1xufVxuXG5mdW5jdGlvbiBzaGFsbG93RXF1YWwob2JqQSwgb2JqQikge1xuICAgIGlmIChvYmpBID09PSBvYmpCKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb2JqQSAhPT0gJ29iamVjdCcgfHwgb2JqQSA9PT0gbnVsbCB8fCB0eXBlb2Ygb2JqQiAhPT0gJ29iamVjdCcgfHwgb2JqQiA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdmFyIGtleXNBID0gT2JqZWN0LmtleXMob2JqQSk7XG4gICAgdmFyIGtleXNCID0gT2JqZWN0LmtleXMob2JqQik7XG5cbiAgICBpZiAoa2V5c0EubGVuZ3RoICE9PSBrZXlzQi5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIFRlc3QgZm9yIEEncyBrZXlzIGRpZmZlcmVudCBmcm9tIEIuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzQS5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoIW9iakIuaGFzT3duUHJvcGVydHkoa2V5c0FbaV0pIHx8IG9iakFba2V5c0FbaV1dICE9PSBvYmpCW2tleXNBW2ldXSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIFB1cmVDb21wb25lbnQocHJvcHMsIGNvbnRleHQpIHtcblx0Q29tcG9uZW50LmNhbGwodGhpcywgcHJvcHMsIGNvbnRleHQpO1xufVxuXG5QdXJlQ29tcG9uZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQ29tcG9uZW50LnByb3RvdHlwZSk7XG5QdXJlQ29tcG9uZW50LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFB1cmVDb21wb25lbnQ7XG5QdXJlQ29tcG9uZW50LnByb3RvdHlwZS5pc1B1cmVSZWFjdENvbXBvbmVudCA9IHRydWU7XG5QdXJlQ29tcG9uZW50LnByb3RvdHlwZS5zaG91bGRDb21wb25lbnRVcGRhdGUgPSBzaGFsbG93Q29tcGFyZTtcblxuZnVuY3Rpb24gc2hhbGxvd0NvbXBhcmUobmV4dFByb3BzLCBuZXh0U3RhdGUpIHtcblx0cmV0dXJuICFzaGFsbG93RXF1YWwodGhpcy5wcm9wcywgbmV4dFByb3BzKSB8fCAhc2hhbGxvd0VxdWFsKHRoaXMuc3RhdGUsIG5leHRTdGF0ZSk7XG59XG5cbnZhciBSZWFjdCA9IGV4dGVuZCh7XG4gICAgdmVyc2lvbjogJzAuMTUuMScsXG4gICAgY2xvbmVFbGVtZW50OiBjbG9uZUVsZW1lbnQsXG4gICAgaXNWYWxpZEVsZW1lbnQ6IGlzVmFsaWRFbGVtZW50LFxuICAgIGNyZWF0ZUVsZW1lbnQ6IGNyZWF0ZUVsZW1lbnQsXG4gICAgY3JlYXRlRmFjdG9yeTogY3JlYXRlRmFjdG9yeSxcbiAgICBDb21wb25lbnQ6IENvbXBvbmVudCxcbiAgICBQdXJlQ29tcG9uZW50OiBQdXJlQ29tcG9uZW50LFxuICAgIGNyZWF0ZUNsYXNzOiBjcmVhdGVDbGFzcyxcbiAgICBDaGlsZHJlbjogQ2hpbGRyZW4sXG4gICAgUHJvcFR5cGVzOiBQcm9wVHlwZXMsXG4gICAgRE9NOiBET01cbn0sIFJlYWN0RE9NKTtcblxuUmVhY3QuX19TRUNSRVRfRE9NX0RPX05PVF9VU0VfT1JfWU9VX1dJTExfQkVfRklSRUQgPSBSZWFjdERPTTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdDtcblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL34vcmVhY3QtbGl0ZS9kaXN0L3JlYWN0LWxpdGUuY29tbW9uLmpzXG4vLyBtb2R1bGUgaWQgPSB6UmVZXG4vLyBtb2R1bGUgY2h1bmtzID0gMCJdLCJzb3VyY2VSb290IjoiIn0=