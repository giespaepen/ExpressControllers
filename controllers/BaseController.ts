"use strict";
    
/// <reference path="../typings/tsd.d.ts"/>
/// <reference path="../typings/express/express.d.ts"/>
import {Express, Request, Response, Router, RequestHandler} from "express";
import express = require("express");

/**
 * Get actionfilter decorator
 */
export function get(path?: string): Function {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        if (typeof target == "object" && target instanceof BaseController) {
            path = fixPath(propertyKey, path);
            LogRouterSetup(ActionType.Get, propertyKey, path);
            (<BaseController>target).RegisterActionFilter(
                target.constructor.name, propertyKey, ActionType.Get, path);
        }
    };
}

/**
 * Post actionfilter decorator
 */
export function post(path?: string): Function {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        if (isTarget(target)) {
            path = fixPath(propertyKey, path);
            LogRouterSetup(ActionType.Get, propertyKey, path);
            (<BaseController>target).RegisterActionFilter(
                target.constructor.name, propertyKey, ActionType.Post, path);
        }
    };
}

/**
 * Put actionfilter decorator
 */
export function put(path?: string): Function {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        if (isTarget(target)) {
            path = fixPath(propertyKey, path);
            LogRouterSetup(ActionType.Get, propertyKey, path);
            (<BaseController>target).RegisterActionFilter(
                target.constructor.name, propertyKey, ActionType.Put, path);
        }
    };
}

/**
 * Delete actionfilter decorator
 */
export function del(path?: string): Function {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        if (isTarget(target)) {
            path = fixPath(propertyKey, path);
            LogRouterSetup(ActionType.Get, propertyKey, path);
            (<BaseController>target).RegisterActionFilter(
                target.constructor.name, propertyKey, ActionType.Delete, path);
        }
    };
}

/**
 * Transmit raw data
 */
export function raw() {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        if (isTarget(target)) {
            var method = descriptor.value;
            var controller = <BaseController>target;
            descriptor.value = function(request: Request, response: Response, next: Function) {
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

/**
 * Transmit a view
 */
export function view(view: string) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        if (isTarget(target)) {
            var method = descriptor.value;
            var controller = <BaseController>target;
            descriptor.value = function(request: Request, response: Response, next: Function) {
                try {
                    // Find the controller instance
                    var controller = BaseController.FindControllerInstance(target.constructor.name);
                    
                    // Apply the method
                    var data = method.apply(controller, [new ActionContext(request, response)]);
                    if(data && (data instanceof Promise || data.then)){
                        // Wait for the promise and return the data
                        (<Promise<any>>data).then((_data) => {
                            response.render(view, _data);
                        });
                    }
                    else{
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

/**
 * Transmit json data
 */
export function json() {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        if (isTarget(target)) {
            var method = descriptor.value;
            var controller = <BaseController>target;

            descriptor.value = function(request: Request, response: Response, next: Function) {
                try {
                    // Find the controller instance
                    var controller = BaseController.FindControllerInstance(target.constructor.name);

                    // Apply the method
                    var data = method.apply(controller, [new ActionContext(request, response)]);
                    if(data && (data instanceof Promise || data.then)){
                        // Wait for the promise and return the data
                        (<Promise<any>>data).then((_data) => {
                            response.json(_data);
                        });
                    }
                    else{
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

/**
 * Check if the target is correct for the decorator
 */
function isTarget(target: any): boolean {
    return typeof target == "object" && target instanceof BaseController;
}

/**
 * Fix the path, change tilde to the propertykey and return a valid path
 */
function fixPath(propertyKey: string, path?: string) {
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

function LogRouterSetup(type: ActionType, propertyKey: string, path: string) {
    console.log(" ... Setting up", type.toString(), "for method ", propertyKey, "->", path);
}

/**
 * Enumeration for the different action filters
 */
export enum ActionType {
    Get,
    Post,
    Put,
    Delete
}

/**
 * Actionfilter storage item
 */
export class ActionFilter {

    public constructor(
        public className: string,
        public key: string,
        public type: ActionType,
        public path?: string
    ) {
        if (!this.path || this.path == "") {
            this.path = "/" + this.key.toLowerCase();
        }
        if (!this.path.startsWith("/")) {
            this.path = "/" + this.path;
        }
    }

    public GetPath() {
        return this.path;
    }
}

/**
 * Action context wrapping the request and response objects
 */
export class ActionContext {

    public urlParams: string[] = [];
    public body: any = null;

    public constructor(public request: Request, public response: Response) {
        this.urlParams = this.ParseParams();
        this.body = this.ParseBody();
    }

    private ParseBody() {
        if (this.request.body)
            return this.request.body;
        else
            return null;
    }

    private ParseParams(): string[] {
        if (this.request.params) {
            var index = 0;
            var result: string[] = [];
            while (this.request.params.hasOwnProperty(index.toString())) {
                if (this.request.params[index.toString()]) {
                    var parts = this.request.params[index.toString()].split("/");
                    parts.forEach((value) => { result.push(value); });
                }
                index++;
            }
            return result;
        }
        else return null;
    }
}

/**
 * A base controller
 */
export class BaseController {
    
    // Storage for all the defined actionfilters
    static actions: ActionFilter[] = [];
    static controllers: BaseController[] = [];
    private express: Express;

    public constructor() {
    }
    
    // Get a configured router
    public GetRouter(): Router {
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
                    router.get(value.GetPath(), <RequestHandler>_this[value.key]);
                    break;
                case ActionType.Post:
                    router.post(value.GetPath(), <RequestHandler>_this[value.key]);
                    break;
                case ActionType.Put:
                    router.put(value.GetPath(), <RequestHandler>_this[value.key]);
                    break;
                case ActionType.Delete:
                    router.delete(value.GetPath(), <RequestHandler>_this[value.key]);
                    break;
            }
        });
        
        // Return it
        return router;
    }
    
    // Register an action filter
    public RegisterActionFilter(className: string, key: string, actionType: ActionType, path?: string): void {
        if (!this.IsActionRegistered(className, key)) {
            BaseController.actions.push(
                new ActionFilter(
                    className, key, actionType, path
                ));
        }
    }
    
    // Register a controller
    public static RegisterController(controller:BaseController){
        var key = controller.constructor.name;
        BaseController.controllers[key] = controller;
    }
    
    // Find a registered controller
    public static FindControllerInstance(key: string){
        return BaseController.controllers[key];
    }
    
    // Avoid double registration of actionfilters
    private IsActionRegistered(className: string, key: string) {
        BaseController.actions.filter((value) =>
            value.className != className && value.key != key
        );
    }
}