"use strict";
const express = require("express");
/**
 * Get actionfilter decorator
 */
function get(path) {
    return (target, propertyKey, descriptor) => {
        if (typeof target == "object" && target instanceof BaseController) {
            path = fixPath(propertyKey, path);
            LogRouterSetup(ActionType.Get, propertyKey, path);
            target.RegisterActionFilter(target.constructor.name, propertyKey, ActionType.Get, path);
        }
    };
}
exports.get = get;
/**
 * Post actionfilter decorator
 */
function post(path) {
    return (target, propertyKey, descriptor) => {
        if (isTarget(target)) {
            path = fixPath(propertyKey, path);
            LogRouterSetup(ActionType.Get, propertyKey, path);
            target.RegisterActionFilter(target.constructor.name, propertyKey, ActionType.Post, path);
        }
    };
}
exports.post = post;
/**
 * Put actionfilter decorator
 */
function put(path) {
    return (target, propertyKey, descriptor) => {
        if (isTarget(target)) {
            path = fixPath(propertyKey, path);
            LogRouterSetup(ActionType.Get, propertyKey, path);
            target.RegisterActionFilter(target.constructor.name, propertyKey, ActionType.Put, path);
        }
    };
}
exports.put = put;
/**
 * Delete actionfilter decorator
 */
function del(path) {
    return (target, propertyKey, descriptor) => {
        if (isTarget(target)) {
            path = fixPath(propertyKey, path);
            LogRouterSetup(ActionType.Get, propertyKey, path);
            target.RegisterActionFilter(target.constructor.name, propertyKey, ActionType.Delete, path);
        }
    };
}
exports.del = del;
/**
 * Transmit raw data
 */
function raw() {
    return (target, propertyKey, descriptor) => {
        if (isTarget(target)) {
            var method = descriptor.value;
            var controller = target;
            descriptor.value = function (request, response, next) {
                try {
                    // Find the controller instance
                    var controller = BaseController.FindControllerInstance(target.constructor.name);
                    // Apply the method
                    var data = method.apply(controller, [new ActionContext(request, response)]);
                    // Return the data
                    response.send(data);
                }
                catch (e) {
                    console.error(e);
                    response.status(500);
                    response.end();
                }
            };
            return descriptor;
        }
    };
}
exports.raw = raw;
/**
 * Transmit a view
 */
function view(view) {
    return (target, propertyKey, descriptor) => {
        if (isTarget(target)) {
            var method = descriptor.value;
            var controller = target;
            descriptor.value = function (request, response, next) {
                try {
                    // Find the controller instance
                    var controller = BaseController.FindControllerInstance(target.constructor.name);
                    // Apply the method
                    var data = method.apply(controller, [new ActionContext(request, response)]);
                    if (data && (data instanceof Promise || data.then)) {
                        // Wait for the promise and return the data
                        data.then((_data) => {
                            response.render(view, _data);
                        });
                    }
                    else {
                        // Return the data sync
                        response.render(view, data);
                    }
                }
                catch (e) {
                    console.error(e);
                    response.status(500);
                    response.end();
                }
            };
            return descriptor;
        }
    };
}
exports.view = view;
/**
 * Transmit json data
 */
function json() {
    return (target, propertyKey, descriptor) => {
        if (isTarget(target)) {
            var method = descriptor.value;
            var controller = target;
            descriptor.value = function (request, response, next) {
                try {
                    // Find the controller instance
                    var controller = BaseController.FindControllerInstance(target.constructor.name);
                    // Apply the method
                    var data = method.apply(controller, [new ActionContext(request, response)]);
                    if (data && (data instanceof Promise || data.then)) {
                        // Wait for the promise and return the data
                        data.then((_data) => {
                            response.json(_data);
                        });
                    }
                    else {
                        // Return the data sync
                        response.json(data);
                    }
                }
                catch (e) {
                    console.error(e);
                    response.status(500);
                    response.end("[]");
                }
            };
            return descriptor;
        }
    };
}
exports.json = json;
/**
 * Check if the target is correct for the decorator
 */
function isTarget(target) {
    return typeof target == "object" && target instanceof BaseController;
}
/**
 * Fix the path, change tilde to the propertykey and return a valid path
 */
function fixPath(propertyKey, path) {
    // Set the path if not defined
    if (path === undefined || path === null) {
        path = "/" + propertyKey;
    }
    // Replace the tilde
    path = path.replace("~", propertyKey);
    // Fix the starting tilde
    if (!path.startsWith("/")) {
        path = "/" + path;
    }
    // Return the path
    return path.toLowerCase();
}
function LogRouterSetup(type, propertyKey, path) {
    console.log(" ... Setting up", type.toString(), "for method ", propertyKey, "->", path);
}
/**
 * Enumeration for the different action filters
 */
(function (ActionType) {
    ActionType[ActionType["Get"] = 0] = "Get";
    ActionType[ActionType["Post"] = 1] = "Post";
    ActionType[ActionType["Put"] = 2] = "Put";
    ActionType[ActionType["Delete"] = 3] = "Delete";
})(exports.ActionType || (exports.ActionType = {}));
var ActionType = exports.ActionType;
/**
 * Actionfilter storage item
 */
class ActionFilter {
    constructor(className, key, type, path) {
        this.className = className;
        this.key = key;
        this.type = type;
        this.path = path;
        if (!this.path || this.path == "") {
            this.path = "/" + this.key.toLowerCase();
        }
        if (!this.path.startsWith("/")) {
            this.path = "/" + this.path;
        }
    }
    GetPath() {
        return this.path;
    }
}
exports.ActionFilter = ActionFilter;
/**
 * Action context wrapping the request and response objects
 */
class ActionContext {
    constructor(request, response) {
        this.request = request;
        this.response = response;
        this.urlParams = [];
        this.body = null;
        this.urlParams = this.ParseParams();
        this.body = this.ParseBody();
    }
    ParseBody() {
        if (this.request.body)
            return this.request.body;
        else
            return null;
    }
    ParseParams() {
        if (this.request.params) {
            var index = 0;
            var result = [];
            while (this.request.params.hasOwnProperty(index.toString())) {
                if (this.request.params[index.toString()]) {
                    var parts = this.request.params[index.toString()].split("/");
                    parts.forEach((value) => { result.push(value); });
                }
                index++;
            }
            return result;
        }
        else
            return null;
    }
}
exports.ActionContext = ActionContext;
/**
 * A base controller
 */
class BaseController {
    constructor() {
    }
    // Get a configured router
    GetRouter() {
        // Create a new router
        var router = express.Router();
        var className = this.constructor.name;
        // Log it
        console.log(" ... Configuring router for", className);
        var _this = this;
        // Configure it based on the stored metadata
        var actions = BaseController.actions.filter((value, index) => {
            return value.className == className;
        });
        // Configure the router
        actions.forEach((value, index) => {
            switch (value.type) {
                case ActionType.Get:
                    router.get(value.GetPath(), _this[value.key]);
                    break;
                case ActionType.Post:
                    router.post(value.GetPath(), _this[value.key]);
                    break;
                case ActionType.Put:
                    router.put(value.GetPath(), _this[value.key]);
                    break;
                case ActionType.Delete:
                    router.delete(value.GetPath(), _this[value.key]);
                    break;
            }
        });
        // Return it
        return router;
    }
    // Register an action filter
    RegisterActionFilter(className, key, actionType, path) {
        if (!this.IsActionRegistered(className, key)) {
            BaseController.actions.push(new ActionFilter(className, key, actionType, path));
        }
    }
    // Register a controller
    static RegisterController(controller) {
        var key = controller.constructor.name;
        BaseController.controllers[key] = controller;
    }
    // Find a registered controller
    static FindControllerInstance(key) {
        return BaseController.controllers[key];
    }
    // Avoid double registration of actionfilters
    IsActionRegistered(className, key) {
        BaseController.actions.filter((value) => value.className != className && value.key != key);
    }
}
// Storage for all the defined actionfilters
BaseController.actions = [];
BaseController.controllers = [];
exports.BaseController = BaseController;

//# sourceMappingURL=BaseController.js.map
