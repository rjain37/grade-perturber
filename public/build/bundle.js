
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.55.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/App.svelte generated by Svelte v3.55.0 */

    const { Object: Object_1 } = globals;
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[24] = list[i];
    	return child_ctx;
    }

    // (382:5) {#each cat.assignments as ass}
    function create_each_block_1(ctx) {
    	let tr;
    	let td0;
    	let input0;
    	let input0_value_value;
    	let td0_class_value;
    	let t0;
    	let td1;
    	let input1;
    	let input1_class_value;
    	let input1_value_value;
    	let t1;
    	let td2;
    	let input2;
    	let input2_class_value;
    	let input2_value_value;
    	let t2;
    	let td3;
    	let t3_value = /*ass*/ ctx[24].percent + "";
    	let t3;
    	let t4;
    	let td3_class_value;
    	let t5;
    	let td4;
    	let button;
    	let tr_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			input0 = element("input");
    			t0 = space();
    			td1 = element("td");
    			input1 = element("input");
    			t1 = space();
    			td2 = element("td");
    			input2 = element("input");
    			t2 = space();
    			td3 = element("td");
    			t3 = text(t3_value);
    			t4 = text("%");
    			t5 = space();
    			td4 = element("td");
    			button = element("button");
    			button.textContent = "Remove";
    			input0.value = input0_value_value = /*ass*/ ctx[24].name;
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "svelte-1hhdct6");
    			add_location(input0, file, 383, 71, 9933);
    			set_style(td0, "text-align", "center");
    			set_style(td0, "width", "25%");
    			attr_dev(td0, "class", td0_class_value = "" + (/*ass*/ ctx[24].name + "name" + " svelte-1hhdct6"));
    			add_location(td0, file, 383, 7, 9869);
    			attr_dev(input1, "class", input1_class_value = "" + (/*cat*/ ctx[21].name + "in" + " svelte-1hhdct6"));
    			input1.value = input1_value_value = /*ass*/ ctx[24].score;
    			attr_dev(input1, "type", "number");
    			add_location(input1, file, 384, 48, 10025);
    			set_style(td1, "text-align", "center");
    			set_style(td1, "width", "25%");
    			attr_dev(td1, "class", "svelte-1hhdct6");
    			add_location(td1, file, 384, 7, 9984);
    			attr_dev(input2, "class", input2_class_value = "" + (/*cat*/ ctx[21].name + "out" + " svelte-1hhdct6"));
    			input2.value = input2_value_value = /*ass*/ ctx[24].outOf;
    			attr_dev(input2, "type", "number");
    			add_location(input2, file, 385, 48, 10173);
    			set_style(td2, "text-align", "center");
    			set_style(td2, "width", "25%");
    			attr_dev(td2, "class", "svelte-1hhdct6");
    			add_location(td2, file, 385, 7, 10132);
    			set_style(td3, "text-align", "center");
    			set_style(td3, "width", "15%");
    			set_style(td3, "padding-bottom", "8.5px");
    			attr_dev(td3, "class", td3_class_value = "" + (/*cat*/ ctx[21].name + "percent" + " svelte-1hhdct6"));
    			add_location(td3, file, 386, 7, 10281);
    			add_location(button, file, 388, 88, 10544);
    			set_style(td4, "text-align", "center");
    			set_style(td4, "width", "10%");
    			set_style(td4, "padding-bottom", "8.5px");
    			attr_dev(td4, "class", "cancel svelte-1hhdct6");
    			add_location(td4, file, 388, 7, 10463);
    			attr_dev(tr, "class", tr_class_value = "" + (/*ass*/ ctx[24].name + "row" + " svelte-1hhdct6"));
    			add_location(tr, file, 382, 6, 9835);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, input0);
    			append_dev(tr, t0);
    			append_dev(tr, td1);
    			append_dev(td1, input1);
    			append_dev(tr, t1);
    			append_dev(tr, td2);
    			append_dev(td2, input2);
    			append_dev(tr, t2);
    			append_dev(tr, td3);
    			append_dev(td3, t3);
    			append_dev(td3, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td4);
    			append_dev(td4, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input1, "change", /*updateAssignments*/ ctx[9], false, false, false),
    					listen_dev(input2, "change", /*updateAssignments*/ ctx[9], false, false, false),
    					listen_dev(
    						button,
    						"click",
    						function () {
    							if (is_function(/*removeAssignment*/ ctx[14](/*ass*/ ctx[24].name))) /*removeAssignment*/ ctx[14](/*ass*/ ctx[24].name).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*categories*/ 2 && input0_value_value !== (input0_value_value = /*ass*/ ctx[24].name) && input0.value !== input0_value_value) {
    				prop_dev(input0, "value", input0_value_value);
    			}

    			if (dirty & /*categories*/ 2 && td0_class_value !== (td0_class_value = "" + (/*ass*/ ctx[24].name + "name" + " svelte-1hhdct6"))) {
    				attr_dev(td0, "class", td0_class_value);
    			}

    			if (dirty & /*categories*/ 2 && input1_class_value !== (input1_class_value = "" + (/*cat*/ ctx[21].name + "in" + " svelte-1hhdct6"))) {
    				attr_dev(input1, "class", input1_class_value);
    			}

    			if (dirty & /*categories*/ 2 && input1_value_value !== (input1_value_value = /*ass*/ ctx[24].score) && input1.value !== input1_value_value) {
    				prop_dev(input1, "value", input1_value_value);
    			}

    			if (dirty & /*categories*/ 2 && input2_class_value !== (input2_class_value = "" + (/*cat*/ ctx[21].name + "out" + " svelte-1hhdct6"))) {
    				attr_dev(input2, "class", input2_class_value);
    			}

    			if (dirty & /*categories*/ 2 && input2_value_value !== (input2_value_value = /*ass*/ ctx[24].outOf) && input2.value !== input2_value_value) {
    				prop_dev(input2, "value", input2_value_value);
    			}

    			if (dirty & /*categories*/ 2 && t3_value !== (t3_value = /*ass*/ ctx[24].percent + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*categories*/ 2 && td3_class_value !== (td3_class_value = "" + (/*cat*/ ctx[21].name + "percent" + " svelte-1hhdct6"))) {
    				attr_dev(td3, "class", td3_class_value);
    			}

    			if (dirty & /*categories*/ 2 && tr_class_value !== (tr_class_value = "" + (/*ass*/ ctx[24].name + "row" + " svelte-1hhdct6"))) {
    				attr_dev(tr, "class", tr_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(382:5) {#each cat.assignments as ass}",
    		ctx
    	});

    	return block;
    }

    // (365:3) {#each categories as cat}
    function create_each_block(ctx) {
    	let table;
    	let tr0;
    	let td0;
    	let t0;
    	let td1;
    	let input0;
    	let input0_value_value;
    	let t1;
    	let input1;
    	let input1_value_value;
    	let t2;
    	let td2;
    	let t3;
    	let td3;
    	let td3_class_value;
    	let t4;
    	let tr1;
    	let td4;
    	let h40;
    	let t6;
    	let td5;
    	let h41;
    	let t8;
    	let td6;
    	let h42;
    	let t10;
    	let td7;
    	let h43;
    	let t12;
    	let td8;
    	let h44;
    	let t14;
    	let t15;
    	let tr2;
    	let td9;
    	let t16;
    	let td10;
    	let button;
    	let t17;
    	let button_class_value;
    	let t18;
    	let td11;
    	let table_id_value;
    	let t19;
    	let br;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*cat*/ ctx[21].assignments;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			table = element("table");
    			tr0 = element("tr");
    			td0 = element("td");
    			t0 = space();
    			td1 = element("td");
    			input0 = element("input");
    			t1 = text("\n\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t  ");
    			input1 = element("input");
    			t2 = space();
    			td2 = element("td");
    			t3 = space();
    			td3 = element("td");
    			t4 = space();
    			tr1 = element("tr");
    			td4 = element("td");
    			h40 = element("h4");
    			h40.textContent = "Assignment";
    			t6 = space();
    			td5 = element("td");
    			h41 = element("h4");
    			h41.textContent = "Points";
    			t8 = space();
    			td6 = element("td");
    			h42 = element("h4");
    			h42.textContent = "Out of";
    			t10 = space();
    			td7 = element("td");
    			h43 = element("h4");
    			h43.textContent = "Score";
    			t12 = space();
    			td8 = element("td");
    			h44 = element("h4");
    			h44.textContent = "Remove";
    			t14 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t15 = space();
    			tr2 = element("tr");
    			td9 = element("td");
    			t16 = space();
    			td10 = element("td");
    			button = element("button");
    			t17 = text("New Assignment");
    			t18 = space();
    			td11 = element("td");
    			t19 = space();
    			br = element("br");
    			set_style(td0, "width", "25%");
    			attr_dev(td0, "class", "svelte-1hhdct6");
    			add_location(td0, file, 367, 6, 8699);
    			input0.value = input0_value_value = /*cat*/ ctx[21].name;
    			attr_dev(input0, "type", "text");
    			set_style(input0, "background-color", "#00b4df");
    			set_style(input0, "outline", "none");
    			set_style(input0, "border-top-style", "hidden");
    			set_style(input0, "border-right-style", "hidden");
    			set_style(input0, "border-left-style", "hidden");
    			set_style(input0, "border-bottom-style", "none");
    			set_style(input0, "font-weight", "bold");
    			set_style(input0, "font-size", "16px");
    			set_style(input0, "width", "160px");
    			attr_dev(input0, "class", "svelte-1hhdct6");
    			add_location(input0, file, 368, 60, 8787);
    			attr_dev(input1, "class", "inh svelte-1hhdct6");
    			input1.value = input1_value_value = /*cat*/ ctx[21].weight * 100;
    			attr_dev(input1, "type", "number");
    			add_location(input1, file, 370, 14, 9107);
    			set_style(td1, "text-align", "center");
    			set_style(td1, "width", "35%");
    			attr_dev(td1, "colspan", "2");
    			attr_dev(td1, "class", "svelte-1hhdct6");
    			add_location(td1, file, 368, 6, 8733);
    			set_style(td2, "text-align", "right");
    			set_style(td2, "width", "15%");
    			attr_dev(td2, "class", "svelte-1hhdct6");
    			add_location(td2, file, 371, 6, 9205);
    			set_style(td3, "text-align", "center");
    			set_style(td3, "width", "10%");
    			attr_dev(td3, "class", td3_class_value = "" + (/*cat*/ ctx[21].name + "grade" + " svelte-1hhdct6"));
    			add_location(td3, file, 372, 6, 9257);
    			set_style(tr0, "margin-bottom", "0.5px");
    			set_style(tr0, "background-color", "#00b4df");
    			add_location(tr0, file, 366, 5, 8633);
    			add_location(h40, file, 375, 65, 9414);
    			set_style(td4, "text-align", "center");
    			set_style(td4, "font-weight", "bold");
    			set_style(td4, "width", "25%");
    			attr_dev(td4, "class", "svelte-1hhdct6");
    			add_location(td4, file, 375, 6, 9355);
    			add_location(h41, file, 376, 65, 9504);
    			set_style(td5, "text-align", "center");
    			set_style(td5, "font-weight", "bold");
    			set_style(td5, "width", "25%");
    			attr_dev(td5, "class", "svelte-1hhdct6");
    			add_location(td5, file, 376, 6, 9445);
    			add_location(h42, file, 377, 65, 9590);
    			set_style(td6, "text-align", "center");
    			set_style(td6, "font-weight", "bold");
    			set_style(td6, "width", "25%");
    			attr_dev(td6, "class", "svelte-1hhdct6");
    			add_location(td6, file, 377, 6, 9531);
    			add_location(h43, file, 378, 65, 9676);
    			set_style(td7, "text-align", "center");
    			set_style(td7, "font-weight", "bold");
    			set_style(td7, "width", "15%");
    			attr_dev(td7, "class", "svelte-1hhdct6");
    			add_location(td7, file, 378, 6, 9617);
    			add_location(h44, file, 379, 65, 9761);
    			set_style(td8, "text-align", "center");
    			set_style(td8, "font-weight", "bold");
    			set_style(td8, "widht", "10%");
    			attr_dev(td8, "class", "svelte-1hhdct6");
    			add_location(td8, file, 379, 6, 9702);
    			add_location(tr1, file, 374, 5, 9344);
    			attr_dev(td9, "class", "svelte-1hhdct6");
    			add_location(td9, file, 392, 6, 10652);
    			attr_dev(button, "class", button_class_value = "" + (/*cat*/ ctx[21].name + "button" + " svelte-1hhdct6"));
    			add_location(button, file, 393, 48, 10710);
    			set_style(td10, "text-align", "center");
    			attr_dev(td10, "colspan", "2");
    			attr_dev(td10, "class", "svelte-1hhdct6");
    			add_location(td10, file, 393, 6, 10668);
    			attr_dev(td11, "class", "svelte-1hhdct6");
    			add_location(td11, file, 394, 6, 10813);
    			add_location(tr2, file, 391, 5, 10641);
    			set_style(table, "width", "55%");
    			attr_dev(table, "id", table_id_value = "" + (/*cat*/ ctx[21].name + "table"));
    			attr_dev(table, "class", "border svelte-1hhdct6");
    			attr_dev(table, "cellspacing", "0");
    			add_location(table, file, 365, 4, 8547);
    			add_location(br, file, 397, 4, 10851);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);
    			append_dev(table, tr0);
    			append_dev(tr0, td0);
    			append_dev(tr0, t0);
    			append_dev(tr0, td1);
    			append_dev(td1, input0);
    			append_dev(td1, t1);
    			append_dev(td1, input1);
    			append_dev(tr0, t2);
    			append_dev(tr0, td2);
    			append_dev(tr0, t3);
    			append_dev(tr0, td3);
    			append_dev(table, t4);
    			append_dev(table, tr1);
    			append_dev(tr1, td4);
    			append_dev(td4, h40);
    			append_dev(tr1, t6);
    			append_dev(tr1, td5);
    			append_dev(td5, h41);
    			append_dev(tr1, t8);
    			append_dev(tr1, td6);
    			append_dev(td6, h42);
    			append_dev(tr1, t10);
    			append_dev(tr1, td7);
    			append_dev(td7, h43);
    			append_dev(tr1, t12);
    			append_dev(tr1, td8);
    			append_dev(td8, h44);
    			append_dev(table, t14);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}

    			append_dev(table, t15);
    			append_dev(table, tr2);
    			append_dev(tr2, td9);
    			append_dev(tr2, t16);
    			append_dev(tr2, td10);
    			append_dev(td10, button);
    			append_dev(button, t17);
    			append_dev(tr2, t18);
    			append_dev(tr2, td11);
    			insert_dev(target, t19, anchor);
    			insert_dev(target, br, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input1, "change", /*updateGrade*/ ctx[8], false, false, false),
    					listen_dev(
    						button,
    						"click",
    						function () {
    							if (is_function(/*addAssignment*/ ctx[10](/*cat*/ ctx[21].name))) /*addAssignment*/ ctx[10](/*cat*/ ctx[21].name).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*categories*/ 2 && input0_value_value !== (input0_value_value = /*cat*/ ctx[21].name) && input0.value !== input0_value_value) {
    				prop_dev(input0, "value", input0_value_value);
    			}

    			if (dirty & /*categories*/ 2 && input1_value_value !== (input1_value_value = /*cat*/ ctx[21].weight * 100) && input1.value !== input1_value_value) {
    				prop_dev(input1, "value", input1_value_value);
    			}

    			if (dirty & /*categories*/ 2 && td3_class_value !== (td3_class_value = "" + (/*cat*/ ctx[21].name + "grade" + " svelte-1hhdct6"))) {
    				attr_dev(td3, "class", td3_class_value);
    			}

    			if (dirty & /*categories, removeAssignment, updateAssignments*/ 16898) {
    				each_value_1 = /*cat*/ ctx[21].assignments;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(table, t15);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (dirty & /*categories*/ 2 && button_class_value !== (button_class_value = "" + (/*cat*/ ctx[21].name + "button" + " svelte-1hhdct6"))) {
    				attr_dev(button, "class", button_class_value);
    			}

    			if (dirty & /*categories*/ 2 && table_id_value !== (table_id_value = "" + (/*cat*/ ctx[21].name + "table"))) {
    				attr_dev(table, "id", table_id_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(br);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(365:3) {#each categories as cat}",
    		ctx
    	});

    	return block;
    }

    // (400:3) {#if grades}
    function create_if_block_1(ctx) {
    	let t_value = /*returnNada*/ ctx[6](/*updateCategoryGrades*/ ctx[13]()) + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(400:3) {#if grades}",
    		ctx
    	});

    	return block;
    }

    // (403:3) {#if newcat[newcatidx]}
    function create_if_block(ctx) {
    	let t0_value = /*returnNada*/ ctx[6](/*updateGrade*/ ctx[8]()) + "";
    	let t0;
    	let t1;
    	let t2_value = /*returnNada*/ ctx[6](/*updateCatIndex*/ ctx[12]()) + "";
    	let t2;

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(403:3) {#if newcat[newcatidx]}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let center;
    	let div0;
    	let h1;
    	let t1;
    	let div1;
    	let textarea;
    	let t2;
    	let br;
    	let t3;
    	let table;
    	let tr;
    	let td0;
    	let t4;
    	let td1;
    	let button0;
    	let t6;
    	let td2;
    	let t7;
    	let a;
    	let t9;
    	let hr;
    	let t10;
    	let button1;
    	let t12;
    	let select;
    	let option;
    	let t14;
    	let script;
    	let t16;
    	let button2;
    	let t18;
    	let button3;
    	let t20;
    	let div2;
    	let h2;
    	let t21;
    	let t22_value = (/*grade*/ ctx[2] * 10000 >> 0) / 100 + "";
    	let t22;
    	let t23;
    	let t24;
    	let p;
    	let strong;
    	let t26;
    	let t27;
    	let t28;
    	let mounted;
    	let dispose;
    	let each_value = /*categories*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	let if_block0 = /*grades*/ ctx[3] && create_if_block_1(ctx);
    	let if_block1 = /*newcat*/ ctx[5][/*newcatidx*/ ctx[4]] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			center = element("center");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Grade Perturber";
    			t1 = space();
    			div1 = element("div");
    			textarea = element("textarea");
    			t2 = space();
    			br = element("br");
    			t3 = space();
    			table = element("table");
    			tr = element("tr");
    			td0 = element("td");
    			t4 = space();
    			td1 = element("td");
    			button0 = element("button");
    			button0.textContent = "Load";
    			t6 = space();
    			td2 = element("td");
    			t7 = text("\n\t\t\tto view an example, see ");
    			a = element("a");
    			a.textContent = "here";
    			t9 = space();
    			hr = element("hr");
    			t10 = space();
    			button1 = element("button");
    			button1.textContent = "Save";
    			t12 = space();
    			select = element("select");
    			option = element("option");
    			option.textContent = "Choose here";
    			t14 = space();
    			script = element("script");
    			script.textContent = "let menu = document.getElementById('loadSelect');\n\t\t\t\tmenu.innerHTML = \"<option value='' selected disabled hidden>Choose here</option>\";\n\t\t\t\tvar saves = Object.keys(localStorage);\n\n\t\t\t\tsaves.forEach ((x) => {\n\t\t\t\t\tvar o = document.createElement(\"option\");\n\t\t\t\t\to.value = x;\n\t\t\t\t\to.innerText = x;\n\n\t\t\t\t\tmenu.appendChild(o);\n\t\t\t\t});";
    			t16 = space();
    			button2 = element("button");
    			button2.textContent = "Load";
    			t18 = space();
    			button3 = element("button");
    			button3.textContent = "Delete";
    			t20 = space();
    			div2 = element("div");
    			h2 = element("h2");
    			t21 = text("    Grade: ");
    			t22 = text(t22_value);
    			t23 = text("%");
    			t24 = space();
    			p = element("p");
    			strong = element("strong");
    			strong.textContent = "+ Add Category";
    			t26 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t27 = space();
    			if (if_block0) if_block0.c();
    			t28 = space();
    			if (if_block1) if_block1.c();
    			add_location(h1, file, 327, 3, 6995);
    			add_location(div0, file, 326, 2, 6986);
    			attr_dev(textarea, "type", "text");
    			attr_dev(textarea, "rows", "8");
    			textarea.value = /*rawtext*/ ctx[0];
    			attr_dev(textarea, "id", "entry");
    			attr_dev(textarea, "placeholder", "Copy and paste your assigments from PowerSchool!");
    			attr_dev(textarea, "class", "svelte-1hhdct6");
    			add_location(textarea, file, 330, 3, 7051);
    			add_location(br, file, 331, 3, 7187);
    			attr_dev(td0, "class", "svelte-1hhdct6");
    			add_location(td0, file, 334, 5, 7267);
    			add_location(button0, file, 335, 66, 7343);
    			set_style(td1, "text-align", "center");
    			set_style(td1, "font-weight", "bold");
    			attr_dev(td1, "colspan", "2");
    			attr_dev(td1, "class", "svelte-1hhdct6");
    			add_location(td1, file, 335, 5, 7282);
    			attr_dev(td2, "class", "svelte-1hhdct6");
    			add_location(td2, file, 336, 5, 7391);
    			set_style(tr, "margin-bottom", "0.5px");
    			add_location(tr, file, 333, 4, 7228);
    			set_style(table, "width", "90%");
    			add_location(table, file, 332, 3, 7195);
    			attr_dev(a, "href", "https://gist.github.com/rjain37/cf138605e890fe6be9b8d25f648d7151");
    			add_location(a, file, 339, 27, 7450);
    			set_style(hr, "width", "75%");
    			add_location(hr, file, 340, 3, 7537);
    			button1.value = "Save";
    			add_location(button1, file, 341, 3, 7563);
    			option.__value = "";
    			option.value = option.__value;
    			option.selected = "";
    			option.disabled = "";
    			option.hidden = "";
    			add_location(option, file, 342, 27, 7641);
    			attr_dev(select, "id", "loadSelect");
    			add_location(select, file, 342, 3, 7617);
    			add_location(script, file, 343, 3, 7725);
    			button2.value = "Load";
    			add_location(button2, file, 356, 3, 8085);
    			button3.value = "Del";
    			add_location(button3, file, 357, 3, 8144);
    			attr_dev(div1, "id", "top");
    			add_location(div1, file, 329, 2, 7031);
    			set_style(h2, "visibility", "hidden");
    			attr_dev(h2, "id", "finalgrade");
    			add_location(h2, file, 361, 3, 8231);
    			add_location(strong, file, 363, 82, 8478);
    			attr_dev(p, "id", "addcat");
    			set_style(p, "position", "relative");
    			set_style(p, "right", "24%");
    			attr_dev(p, "class", "svelte-1hhdct6");
    			add_location(p, file, 363, 3, 8399);
    			attr_dev(div2, "id", "t");
    			add_location(div2, file, 360, 2, 8215);
    			add_location(center, file, 325, 1, 6975);
    			attr_dev(main, "class", "svelte-1hhdct6");
    			add_location(main, file, 324, 0, 6967);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, center);
    			append_dev(center, div0);
    			append_dev(div0, h1);
    			append_dev(center, t1);
    			append_dev(center, div1);
    			append_dev(div1, textarea);
    			append_dev(div1, t2);
    			append_dev(div1, br);
    			append_dev(div1, t3);
    			append_dev(div1, table);
    			append_dev(table, tr);
    			append_dev(tr, td0);
    			append_dev(tr, t4);
    			append_dev(tr, td1);
    			append_dev(td1, button0);
    			append_dev(tr, t6);
    			append_dev(tr, td2);
    			append_dev(div1, t7);
    			append_dev(div1, a);
    			append_dev(div1, t9);
    			append_dev(div1, hr);
    			append_dev(div1, t10);
    			append_dev(div1, button1);
    			append_dev(div1, t12);
    			append_dev(div1, select);
    			append_dev(select, option);
    			append_dev(div1, t14);
    			append_dev(div1, script);
    			append_dev(div1, t16);
    			append_dev(div1, button2);
    			append_dev(div1, t18);
    			append_dev(div1, button3);
    			append_dev(center, t20);
    			append_dev(center, div2);
    			append_dev(div2, h2);
    			append_dev(h2, t21);
    			append_dev(h2, t22);
    			append_dev(h2, t23);
    			append_dev(div2, t24);
    			append_dev(div2, p);
    			append_dev(p, strong);
    			append_dev(div2, t26);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			append_dev(div2, t27);
    			if (if_block0) if_block0.m(div2, null);
    			append_dev(div2, t28);
    			if (if_block1) if_block1.m(div2, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*load*/ ctx[7], false, false, false),
    					listen_dev(button1, "click", /*save*/ ctx[15], false, false, false),
    					listen_dev(button2, "click", /*loadClass*/ ctx[16], false, false, false),
    					listen_dev(button3, "click", deleteClass, false, false, false),
    					listen_dev(p, "click", /*addCategory*/ ctx[11], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*rawtext*/ 1) {
    				prop_dev(textarea, "value", /*rawtext*/ ctx[0]);
    			}

    			if (dirty & /*grade*/ 4 && t22_value !== (t22_value = (/*grade*/ ctx[2] * 10000 >> 0) / 100 + "")) set_data_dev(t22, t22_value);

    			if (dirty & /*categories, addAssignment, removeAssignment, updateAssignments, updateGrade*/ 18178) {
    				each_value = /*categories*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, t27);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (/*grades*/ ctx[3]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					if_block0.m(div2, t28);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*newcat*/ ctx[5][/*newcatidx*/ ctx[4]]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					if_block1.m(div2, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function Line(text, name, score, outOf, category) {
    	if (text == "") {
    		this.name = name;
    		this.score = score;
    		this.outOf = outOf;
    		this.percent = (parseFloat(this.score) / parseFloat(this.outOf) * 10000 >> 0) / 100;
    		this.category = category;
    	} else {
    		this.splitted = text.split("\t");
    		this.category = this.splitted[1];
    		this.name = this.splitted[2];
    		this.gradetext = this.splitted[10];
    		this.score = this.gradetext.substr(0, this.gradetext.indexOf('/'));
    		this.outOf = this.gradetext.substr(this.gradetext.indexOf('/') + 1, this.gradetext.length);
    		this.percent = (parseFloat(this.score) / parseFloat(this.outOf) * 10000 >> 0) / 100;
    	}
    }

    function Category(name, weight, assignments) {
    	this.weight = weight;
    	this.name = name;
    	this.assignments = assignments;
    }

    function loadMenu() {
    	let menu = document.getElementById('loadSelect');
    	menu.innerHTML = "<option value='' selected disabled hidden>Choose here</option>";
    	var saves = Object.keys(localStorage);

    	saves.forEach(x => {
    		var o = document.createElement("option");
    		o.value = x;
    		o.innerText = x;
    		menu.appendChild(o);
    	});
    }

    function deleteClass() {
    	let menu = document.getElementById('loadSelect');
    	var name = menu.value;
    	localStorage.removeItem(name);
    	loadMenu();
    }

    function instance($$self, $$props, $$invalidate) {
    	let grades;
    	let newcat;
    	let newcatidx;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let rawtext = "";
    	let categories = [];
    	let grade = 0;
    	let b = document.getElementById('t');
    	let temp;
    	const returnNada = () => '';

    	const load = () => {
    		$$invalidate(0, rawtext = document.getElementById("entry").value);
    		let linestext = rawtext.split("\n");

    		if (rawtext.startsWith("Welcome, ")) {
    			let temparr = rawtext.split("Assignments");
    			let temparr2 = temparr[1].split("Grades last updated on");
    			$$invalidate(0, rawtext = temparr2[0]);
    			linestext = rawtext.split("\n");

    			//some formatting that deals with extra lines
    			linestext.shift();

    			linestext.shift();
    			linestext.pop();
    		}

    		var lines = [];
    		var cats = [];

    		if (linestext[0].startsWith("Due Date")) {
    			linestext.shift();
    		}

    		linestext.forEach(linetext => lines = [...lines, new Line(linetext)]);
    		$$invalidate(1, categories = []);

    		lines.forEach(ass => {
    			if (ass.score == "--") {
    				return;
    			}

    			if (cats.indexOf(ass.category) == -1) {
    				let temparr = [];
    				var newc = new Category(ass.category, 0.2, temparr);
    				cats = [...cats, ass.category];
    				$$invalidate(1, categories = [...categories, newc]);
    			}
    		});

    		var per = 1 / categories.length;
    		categories.forEach(tempcat => tempcat.weight = Math.floor(per * 100) / 100);

    		lines.forEach(ass => {
    			if (ass.score == "--") {
    				return;
    			}

    			for (let i = 0; i < categories.length; i++) {
    				if (categories[i].name == ass.category) {
    					$$invalidate(1, categories[i].assignments = [...categories[i].assignments, ass], categories);
    				}
    			}
    		});

    		document.getElementById("finalgrade").style.visibility = "visible";
    		calcGrade();
    		$$invalidate(3, grades = true);
    	};

    	function calcGrade() {
    		let tempGrade = 0;
    		let totalPercent = 0;

    		categories.forEach(cat => {
    			let points = 0;
    			let total = 0;

    			if (cat.assignments.length == 0) {
    				return;
    			}

    			cat.assignments.forEach(ass => {
    				points += parseFloat(ass.score);
    				total += parseFloat(ass.outOf);
    			});

    			tempGrade += points / total * cat.weight;
    			totalPercent += cat.weight;
    		});

    		$$invalidate(2, grade = tempGrade / totalPercent);
    	}

    	function updateGrade() {
    		let temp = 0;

    		categories.forEach(cat => {
    			cat.weight = parseFloat(document.getElementsByClassName("inh")[temp].value) / 100;
    			temp++;
    		});

    		calcGrade();
    		updateCategoryGrades();
    	}

    	function updateAssignments() {
    		categories.forEach(cat => {
    			let temp = 0;

    			cat.assignments.forEach(ass => {
    				ass.score = document.getElementsByClassName(cat.name + "in")[temp].value;
    				ass.outOf = document.getElementsByClassName(cat.name + "out")[temp].value;
    				ass.percent = (parseFloat(ass.score) / parseFloat(ass.outOf) * 10000 >> 0) / 100;
    				document.getElementsByClassName(cat.name + "percent")[temp].innerHTML = "" + ass.percent + "%";
    				temp++;
    			});
    		});

    		calcGrade();
    		updateCategoryGrades();
    	}

    	function addAssignment(cat) {
    		let assnum = numAssignments() + 1;

    		for (let i = 0; i < categories.length; i++) {
    			if (categories[i].name == cat) {
    				$$invalidate(
    					1,
    					categories[i].assignments = [
    						...categories[i].assignments,
    						new Line("", "New Assignment " + assnum, 0, 100, cat)
    					],
    					categories
    				);
    			}
    		}

    		let table = document.getElementById(cat + "table");
    		table.rows[table.rows.length - 1];
    		let clonedRow = table.rows[table.rows.length - 2].cloneNode(true);
    		clonedRow.cells[0].innerHTML = "<input type='text' value='New Assignment " + assnum + "'>";
    		clonedRow.cells[1].childNodes[0].addEventListener("change", updateAssignments);
    		clonedRow.cells[2].childNodes[0].addEventListener("change", updateAssignments);
    		updateAssignments();
    	}

    	function addCategory() {
    		let catnum = categories.length + 1;
    		let assnum = numAssignments() + 1;

    		$$invalidate(1, categories = [
    			new Category("New Category " + catnum,
    			0,
    			[
    					new Line("", "New Assignment " + assnum, 0, 100, "New Category " + catnum)
    				]),
    			...categories
    		]);

    		$$invalidate(5, newcat[newcatidx] = true, newcat);
    		document.getElementById("finalgrade").style.visibility = "visible";
    	}

    	function updateCatIndex() {
    		$$invalidate(4, newcatidx++, newcatidx);
    	}

    	function numAssignments() {
    		let temp = 0;

    		categories.forEach(cat => {
    			temp += cat.assignments.length;
    		});

    		return temp;
    	}

    	function updateCategoryGrades() {
    		for (let i = 0; i < categories.length; i++) {
    			let points = 0;
    			let total = 0;

    			categories[i].assignments.forEach(ass => {
    				points += parseFloat(ass.score);
    				total += parseFloat(ass.outOf);
    			});

    			document.getElementsByClassName(categories[i].name + "grade")[0].innerHTML = "<h3>" + Math.round(points / total * 10000) / 100 + "%</h3>";
    		}
    	}

    	function removeAssignment(assName) {
    		for (let i = 0; i < categories.length; i++) {
    			for (let j = 0; j < categories[i].assignments.length; j++) {
    				if (categories[i].assignments[j].name == assName) {
    					categories[i].assignments.splice(j, 1);
    					document.getElementsByClassName(assName + "row")[0].remove();
    				}
    			}
    		}

    		updateAssignments();
    	}

    	function save() {
    		var data = { 'assignments': categories };
    		var name = prompt("Enter class name");
    		localStorage.setItem(name, JSON.stringify(data));
    		loadMenu();
    	}

    	function loadClass() {
    		var name = menu.value;
    		var data = JSON.parse(localStorage.getItem(name));
    		$$invalidate(1, categories = data.assignments);
    		loadMenu();
    		$$invalidate(3, grades = true);
    		calcGrade();
    		document.getElementById("finalgrade").style.visibility = "visible";
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		rawtext,
    		categories,
    		grade,
    		b,
    		temp,
    		returnNada,
    		load,
    		Line,
    		Category,
    		calcGrade,
    		updateGrade,
    		updateAssignments,
    		addAssignment,
    		addCategory,
    		updateCatIndex,
    		numAssignments,
    		updateCategoryGrades,
    		removeAssignment,
    		save,
    		loadClass,
    		loadMenu,
    		deleteClass,
    		grades,
    		newcatidx,
    		newcat
    	});

    	$$self.$inject_state = $$props => {
    		if ('rawtext' in $$props) $$invalidate(0, rawtext = $$props.rawtext);
    		if ('categories' in $$props) $$invalidate(1, categories = $$props.categories);
    		if ('grade' in $$props) $$invalidate(2, grade = $$props.grade);
    		if ('b' in $$props) b = $$props.b;
    		if ('temp' in $$props) temp = $$props.temp;
    		if ('grades' in $$props) $$invalidate(3, grades = $$props.grades);
    		if ('newcatidx' in $$props) $$invalidate(4, newcatidx = $$props.newcatidx);
    		if ('newcat' in $$props) $$invalidate(5, newcat = $$props.newcat);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$invalidate(3, grades = false);
    	$$invalidate(5, newcat = [false]);
    	$$invalidate(4, newcatidx = 0);

    	return [
    		rawtext,
    		categories,
    		grade,
    		grades,
    		newcatidx,
    		newcat,
    		returnNada,
    		load,
    		updateGrade,
    		updateAssignments,
    		addAssignment,
    		addCategory,
    		updateCatIndex,
    		updateCategoryGrades,
    		removeAssignment,
    		save,
    		loadClass
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
