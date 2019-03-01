/*

JSON 2 HTML Converter 
=====================
Author : Harsh Chaurasia; Feb 2019

Javascript Version of JSON2HTML Python library

*/

Json2Html = (function () {
    var Json2Html = new Object();
    Json2Html.convert = function (json, table_attributes, clubbing, encode, escape) {

        /* 
           * Returns Convert JSON to HTML Table format
           * 
           * @ table attributes such as class, id, data-attr-*, etc.
           * eg: table_attributes = 'class = "table table-bordered sortable"'
        */
        if (!json) json = "";
        if (!table_attributes) table_attributes = "border='1'";
        if (clubbing == undefined) clubbing = true;
        if (encode == undefined) encode = false;
        if (escape == undefined) escape = true;

        Json2Html.table_init_markup = "<table " + table_attributes + ">";
        Json2Html.clubbing = clubbing;
        Json2Html.escape = escape;
        json_input = null;
        if (!json) {
            json_input = {};
        }
        else if (typeof json === typeof "")
            try {
                //json_input = json_parser.loads(json, object_pairs_hook=OrderedDict)
                if (json.indexOf("ObjectId('") > 0) {
                    json = json.replace("ObjectId('", "'").replace("')", "'");

                }
                json = json.replace(new RegExp("'", 'g'), '"');
                json_input = JSON.parse(json);
            }
            catch (ex) {
                //so the string passed here is actually not a json string
                // - let's analyze whether we want to pass on the error or use //the string as-is as a text node
                //if u"Expecting property name" in text(e):
                //if this specific json loads error is raised, then the user probably actually wanted to pass json, but made a mistake
                throw ex;

            }
        else {
            json_input = json;
        }
        converted = Json2Html.convert_json_node(json_input);
        if (encode)
            return converted.encode('ascii', 'xmlcharrefreplace');
        return converted;
    };

    Json2Html.column_headers_from_list_of_dicts = function (json_input) {
        /* """
             This method is required to implement clubbing.
             It tries to come up with column headers for your input
         """*/
        if (!json_input || json_input.length === 0) {
            return null;
        }
        column_headers = Object.keys(json_input[0]);
        json_input.forEach(function (entry) {
            if (!entry || !entry.keys || entry.length > 0 || entry.keys.length !== column_headers.length)
                return null;
            column_headers.forEach(function (header) {
                if (!entry[header])
                    return null;
            });
        });
        return column_headers;
    };

    Json2Html.convert_json_node = function (json_input) {
        /* 
           * Dispatch JSON input according to the outermost type and process it
           * to generate the super awesome HTML format.
           * We try to adhere to duck typing such that users can just pass all kinds
           * of funky objects to json2html that *behave* like dicts and lists and other
           * basic JSON types.
        */

        //if type(json_input) in text_types:
        if (typeof json_input === typeof ""
            || typeof json_input === typeof 0
            || typeof json_input === typeof true) {
            if (Json2Html.escape)
                //return cgi.escape(text(json_input));
                return json_input;
            else
                //return text(json_input);
                return json_input;
        }
        if (json_input && json_input.length > 0)
            return Json2Html.convert_list(json_input);
        //if (json_input.has, 'items'){
        if (json_input) {
            return Json2Html.convert_object(json_input);
        }
        //if hasattr(json_input, '__iter__') and hasattr(json_input, '__getitem__'):
        if (json_input == null)
            return "";
        return json_input;
    };

    Json2Html.convert_list = function (list_input) {
        /*
            Iterate over the JSON list and process it
            to generate either an HTML table or a HTML list, depending on what's inside.
            If suppose some key has array of objects and all the keys are same,
            instead of creating a new row for each such entry,
            club such values, thus it makes more sense and more readable table.
            @example:
                jsonObject = {
                    "sampleData": [
                        {"a":1, "b":2, "c":3},
                        {"a":5, "b":6, "c":7}
                    ]
                }
                OUTPUT:
                _____________________________
                |               |   |   |   |
                |               | a | c | b |
                |   sampleData  |---|---|---|
                |               | 1 | 3 | 2 |
                |               | 5 | 7 | 6 |
                -----------------------------
            
        */
        if (!list_input)
            return "";
        converted_output = "";
        column_headers = null;
        if (Json2Html.clubbing)
            column_headers = Json2Html.column_headers_from_list_of_dicts(list_input);
        if (column_headers) {
            converted_output += Json2Html.table_init_markup;
            converted_output += '<thead>';
            converted_output += '<tr><th>' + column_headers.join('</th><th>') + '</th></tr>';
            converted_output += '</thead>';
            converted_output += '<tbody>';
            list_input.forEach(function (list_entry) {
                converted_output += '<tr><td>';
                //converted_output += '</td><td>'.concat(this.convert_json_node)
                column_headers.forEach(function (column_header) {
                    converted_output += Json2Html.convert_json_node(list_entry[column_header]) + '</td><td>';

                });

                converted_output += '</td></tr>';
            });
            converted_output += '</tbody>';
            converted_output += '</table>';
            return converted_output;
        }

        converted_output = '<ul><li>';
        //converted_output += '</li><li>'.join([this.convert_json_node(child) for child in list_input])
        list_input.forEach(function (child) {
            converted_output += '</li><li>' + Json2Html.convert_json_node(child).toString();
        });
        converted_output += '</li></ul>';
        return converted_output;
    };

    Json2Html.convert_object = function (json_input) {
        /*""" 
            Iterate over the JSON object and process it
            to generate the super awesome HTML Table format
        """*/
        if (!json_input)
            return ""; //#avoid empty tables
        converted_output = Json2Html.table_init_markup + "<tr>";
        //for k, v in json_input.items()
        for (var k in json_input) {
            if (json_input.hasOwnProperty(k)) {

                converted_output +=
                    "</tr><tr>" + "<th>" + Json2Html.convert_json_node(k) + "</th><td>" + Json2Html.convert_json_node(json_input[k]) + "</td>";
            }
        }
        converted_output += '</tr></table>';

        return converted_output;
    };

    return Json2Html;
})();