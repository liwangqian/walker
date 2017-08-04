/*globals exports, require */

'use strict';

const check = require('check-types');

exports.walker = walker;

/* thanks for Phil Booth@escomplex and escomplex-ast-moz. 
 * add: suport for different syntex definition
 */
function walker(syntaxDefinitions) {
    return function walk (tree, settings, callbacks) {
        var syntaxes;

        check.assert.object(tree, 'Invalid syntax tree');
        check.assert.array(tree.body, 'Invalid syntax tree body');
        check.assert.object(settings, 'Invalid settings');
        check.assert.object(callbacks, 'Invalid callbacks');
        check.assert.function(callbacks.processNode, 'Invalid processNode callback');
        check.assert.function(callbacks.createScope, 'Invalid createScope callback');
        check.assert.function(callbacks.popScope, 'Invalid popScope callback');

        syntaxes = syntaxDefinitions.get(settings);

        visitNodes(tree.body);

        function visitNodes (nodes) {
            nodes.forEach(function (node) {
                visitNode(node);
            });
        }

        function visitNode (node) {
            var syntax;

            if (check.object(node)) {
                syntax = syntaxes[node.type];

                if (check.object(syntax)) {
                    callbacks.processNode(node, syntax);

                    if (syntax.newScope) {
                        syntax.newScope(node, syntax, callbacks.createScope);
                        // callbacks.createScope(syntax.assignableName(node), node.loc, node.params.length);
                    }

                    visitChildren(node);

                    if (syntax.newScope) {
                        callbacks.popScope();
                    }
                }
            }
        }

        function visitChildren (node) {
            var syntax = syntaxes[node.type];

            if (check.array(syntax.children)) {
                syntax.children.forEach(function (child) {
                    visitChild(
                        node[child],
                        check.function(syntax.assignableName) ? syntax.assignableName(node) : ''
                    );
                });
            }
        }

        function visitChild (child) {
            var visitor = check.array(child) ? visitNodes : visitNode;
            visitor(child);
        }
    }
}
