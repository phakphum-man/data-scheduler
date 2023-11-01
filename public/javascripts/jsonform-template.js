/*
var jsonform = {
    "schema": {
      "text": {
        "type": "string",
        "title": "Text"
      }
    },
    "form": [
      {
        "key": "text",
        "onChange": function (evt) {
          var value = $(evt.target).val();
          if (value) alert(value);
        }
      },
      {
        "type": "button",
        "title": "Click me",
        "onClick": function (evt) {
          evt.preventDefault();
          alert('Thank you!');        
        }
      }
    ]
};
$('form').jsonForm(jsonform);*/
JSONForm.fieldTypes['divRow'] = {
  template: '<div' +
    '<% if (node.id) { %> id="<%= node.id %>"<% } %> class="row"' +
    '><%= children %></div>'
};