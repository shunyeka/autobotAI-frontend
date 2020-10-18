(function () {

    // Define our constructor
    this.ResourceTable = function () {

        // Create global element references
        this.container = null;

        // Define option defaults
        var defaults = {
            container: '',
            resourceArray: [],
            environments: []
        }

        // Create options by extending defaults with the passed in arugments
        if (arguments[0] && typeof arguments[0] === "object") {
            this.options = extendDefaults(defaults, arguments[0]);
        }
        init.call(this);
    }

    // Public Methods
    ResourceTable.prototype.getTaggedResources = function () {
        return this.options.resourceArray.filter(resource => resource.hasOwnProperty('env')).map(resource => ({
            'id': resource.id,
            'env': resource.env,
            'region': resource.region
        }));
    }

    //Private Methods
    function init() {
        if (window.tableTemplate == null) {
            var source = document.getElementById("resource-table-template").innerHTML;
            window.tableTemplate = Handlebars.compile(source);
        }
        $(this.options.container).html(window.tableTemplate({}));
        populateDropdowns.call(this);
        populateTable.call(this);
        initializeEvents.call(this);
    }

    function populateDropdowns() {
        this.options.environments.map(environment => {
            $a = $('<a>', {
              class: 'dropdown-item',
              href: '#'
            }).text(environment.label).data('env', environment);
            $(this.options.container).find('.action-dropdown .dropdown-menu').append($('<li>').append($a));
            $(this.options.container).find('.filter-dropdown').append($('<option>', {
                value: environment.label
            }).text(environment.label));
        });
    }

    function populateTable() {
        var self = this;
        if (window.resourceRowTemplate == null) {
            var source = document.getElementById("resource-row-template").innerHTML;
            window.resourceRowTemplate = Handlebars.compile(source);
        }

        Handlebars.registerHelper('resourceEnvironment', function (context) {
            var envTag = context.data.root.resource.tags.find(tag => tag.Key == 'environment');
            if (envTag != null) {
                environment = context.data.root.environments.find(env => env.name === envTag.Value);
                if(environment != null){
                    return environment.label;
                }
            }
            return null;
        });

        this.options.resourceArray.map(resource => {
            var $tr = $(window.resourceRowTemplate({environments: self.options.environments, resource: resource}));
            $tr.data('resourceRef', resource);
            $(this.options.container).find('tbody').append($tr);
        });
    }

    function initializeEvents() {
        var _ = this;
        var container = this.options.container;
        $(container).find('thead :checkbox').change(function () {
            if (this.checked) {
                $(container).find("tr:visible :checkbox").prop('checked', true);
            } else {
                $(container).find("tr:visible :checkbox").prop('checked', false);
            }
        });
        $(container).find('.action-dropdown .dropdown-menu a').click(function () {          
            $(container).find('thead :checkbox').prop('checked', false);
            var env = $(this).data('env');
            $(container).find('tr input:checked').each(function () {
                $(this).prop('checked', false);
                $(this).closest('tr').find('td:last-child').text(env.label);
                $(this).closest('tr').data('resourceRef').env = env.name;
            });
        });
        $(container).find(".resource-search-box").on("keyup", function () {
            filterInstances.call(_);
        });
        $(container).find('.filter-dropdown').change(function () {
            filterInstances.call(_);
        });
    }

    function filterInstances() {
        var textFilter = $(this.options.container).find(".resource-search-box").val().toLowerCase();
        var dropDownFilter = $(this.options.container).find('.filter-dropdown').val();

        var showTr = function (tr, dropDownFilter, textFilter) {
            var returnValue = true;
            if (dropDownFilter == 'unassigned') {
                returnValue = $(tr).find('td:last-child').is(':empty');
            } else if (dropDownFilter != 'all') {
                returnValue = $(tr).find('td:last-child').text().indexOf(dropDownFilter) > -1
            }
            if (returnValue && textFilter != null && textFilter != '') {
                returnValue = $(tr).find('td:not(:last-child)').text().toLowerCase().indexOf(textFilter) > -1;
            }
            return returnValue;
        }

        $(this.options.container).find("tbody tr").filter(function () {
            var tr = this;
            $(tr).toggle(showTr(tr, dropDownFilter, textFilter));
        });
    }

    // Utility method to extend defaults with user options
    function extendDefaults(source, properties) {
        var property;
        for (property in properties) {
            if (properties.hasOwnProperty(property)) {
                source[property] = properties[property];
            }
        }
        return source;
    }

}());
