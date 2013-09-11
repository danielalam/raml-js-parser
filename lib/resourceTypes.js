(function() {
  var MarkedYAMLError, nodes, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  MarkedYAMLError = require('./errors').MarkedYAMLError;

  nodes = require('./nodes');

  /*
  The ResourceTypes throws these.
  */


  this.ResourceTypeError = (function(_super) {
    __extends(ResourceTypeError, _super);

    function ResourceTypeError() {
      _ref = ResourceTypeError.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    return ResourceTypeError;

  })(MarkedYAMLError);

  /*
  The ResourceTypes class deals with applying ResourceTypes to resources according to the spec
  */


  this.ResourceTypes = (function() {
    function ResourceTypes() {
      this.apply_parameters_to_type = __bind(this.apply_parameters_to_type, this);
      this.apply_type = __bind(this.apply_type, this);
      this.apply_types = __bind(this.apply_types, this);
      this.get_type = __bind(this.get_type, this);
      this.has_types = __bind(this.has_types, this);
      this.load_types = __bind(this.load_types, this);
      this.declaredTypes = {};
    }

    ResourceTypes.prototype.load_types = function(node) {
      var allTypes,
        _this = this;
      if (this.has_property(node, /^resourceTypes$/i)) {
        allTypes = this.property_value(node, /^resourceTypes$/i);
        if (allTypes && typeof allTypes === "object") {
          return allTypes.forEach(function(type_item) {
            if (type_item && typeof type_item === "object" && typeof type_item.value === "object") {
              return type_item.value.forEach(function(type) {
                return _this.declaredTypes[type[0].value] = type;
              });
            }
          });
        }
      }
    };

    ResourceTypes.prototype.has_types = function(node) {
      if (Object.keys(this.declaredTypes).length === 0 && this.has_property(node, /^resourceTypes$/i)) {
        this.load_types(node);
      }
      return Object.keys(this.declaredTypes).length > 0;
    };

    ResourceTypes.prototype.get_type = function(typeName) {
      return this.declaredTypes[typeName];
    };

    ResourceTypes.prototype.get_parent_type_name = function(typeName) {
      var type;
      type = (this.get_type(typeName))[1];
      if (type && this.has_property(type, /^type$/i)) {
        return this.property_value(type, /^type$/i);
      }
      return null;
    };

    ResourceTypes.prototype.apply_types = function(node) {
      var resources,
        _this = this;
      this.check_is_map(node);
      if (this.has_types(node)) {
        resources = this.child_resources(node);
        return resources.forEach(function(resource) {
          var type;
          if (_this.has_property(resource[1], /^type$/i)) {
            type = _this.get_property(resource[1], /^type$/i);
            return _this.apply_type(resource, type);
          }
        });
      }
    };

    ResourceTypes.prototype.apply_type = function(resource, typeKey) {
      var tempType;
      tempType = this.resolve_inheritance_chain(typeKey);
      tempType.combine(resource[1]);
      resource[1] = tempType;
      return resource[1].remove_question_mark_properties();
    };

    ResourceTypes.prototype.resolve_inheritance_chain = function(typeKey) {
      var baseType, child_type, child_type_key, compiledTypes, inherits_from, parentTypeMapping, parentTypeName, result, root_type, type, typeName, typesToApply;
      typeName = this.key_or_value(typeKey);
      compiledTypes = {};
      type = this.apply_parameters_to_type(typeName, typeKey);
      this.apply_traits_to_resource(type, false);
      compiledTypes[typeName] = type;
      typesToApply = [typeName];
      child_type = typeName;
      parentTypeName = null;
      while (parentTypeName = this.get_parent_type_name(child_type)) {
        if (parentTypeName in compiledTypes) {
          throw new exports.ResourceTypeError('while aplying resourceTypes', null, 'circular reference detected: ' + parentTypeName + "->" + typesToApply, child_type.start_mark);
        }
        child_type_key = this.get_property(this.get_type(child_type)[1], /^type$/i);
        parentTypeMapping = this.apply_parameters_to_type(parentTypeName, child_type_key);
        compiledTypes[parentTypeName] = parentTypeMapping;
        this.apply_traits_to_resource(parentTypeMapping[1], false);
        typesToApply.push(parentTypeName);
        child_type = parentTypeName;
      }
      root_type = typesToApply.pop();
      baseType = compiledTypes[root_type].cloneRemoveIs();
      result = baseType;
      while (inherits_from = typesToApply.pop()) {
        baseType = compiledTypes[inherits_from].cloneRemoveIs();
        baseType.combine(result);
        result = baseType;
      }
      return result;
    };

    ResourceTypes.prototype.apply_parameters_to_type = function(typeName, typeKey) {
      var parameters, type;
      type = (this.get_type(typeName))[1].cloneForTrait();
      parameters = this._get_parameters_from_type_key(typeKey);
      this.apply_parameters(type, parameters, typeKey);
      return type;
    };

    ResourceTypes.prototype._get_parameters_from_type_key = function(typeKey) {
      var parameters, result;
      parameters = this.value_or_undefined(typeKey);
      result = {};
      if (parameters && parameters[0] && parameters[0][1] && parameters[0][1].value) {
        parameters[0][1].value.forEach(function(parameter) {
          if (parameter[1].tag !== 'tag:yaml.org,2002:str') {
            throw new exports.ResourceTypeError('while aplying parameters', null, 'parameter value is not a scalar', parameter[1].start_mark);
          }
          return result[parameter[0].value] = parameter[1].value;
        });
      }
      return result;
    };

    return ResourceTypes;

  })();

}).call(this);