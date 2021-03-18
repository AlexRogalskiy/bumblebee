import {
  deepCopy,
  everyRatio,
  arrayJoin,
  capitalizeString,
  printError,
  parseResponse,
  escapeQuotes,
  newName,
  getProperty,
  multipleContent,
  hlParam,
  hlCols,
  aggOutputCols,
  transpose,
  objectMap,
  TIME_NAMES,
} from "bumblebee-utils";

export const commandsHandlers = {

  /* load */

  loadFile: {
    dialog: {
      title: "Load file",
      acceptLabel: "Load",
      fields: [
        {
          key: "_fileInput",
          label: "File upload",
          accept:
            "text/csv, .csv, application/json, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, .xls, .xlsx, .avro, .parquet",
          type: "file",
          onClear: "clearFile",
        },
        {
          condition: (c) =>
            c._fileInput &&
            c._fileInput.toString() &&
            c._fileInput !== c._fileLoaded,
          type: "action",
          label: "Preview",
          loading: "_fileUploading",
          loadingProgress: "_fileUploadingProgress",
          func: "uploadFile",
        },
        {
          key: "_moreOptions",
          label: (c) => `More options: ${c._moreOptions ? "Yes" : "No"}`,
          type: "switch",
        },
        {
          key: "_connection",
          type: "connection",
          include: "remotes",
          condition: (c) => c._moreOptions && !c.url,
        },
        {
          key: "external_url",
          label: "External url",
          placeholder: (c) => {
            var fileType = c.file_type != "infer" ? c.file_type : c._fileType;
            fileType = fileType ? `.${fileType}` : "";
            return `https://example.com/my_file${fileType}`;
          },
          disabled: (c) => c.url,
          type: "field",
          condition: (c) => c._moreOptions,
        },
        {
          condition: (c) => c._moreOptions,
          key: "limit",
          label: "Limit",
          min: 1,
          clearable: true,
          type: "number",
        },
        {
          key: "file_type",
          label: "File type",
          type: "select",
          items: [
            { text: "Infer file type", value: "file" },
            { text: "CSV", value: "csv" },
            { text: "XLS", value: "xls" },
            { text: "JSON", value: "json" },
            { text: "Avro", value: "avro" },
            { text: "Parquet", value: "parquet" },
          ],
          condition: (c) => c._moreOptions,
        },
        {
          condition: (c) => c.file_type === "csv" && c._moreOptions,
          key: "header",
          label: (c) => `First row as Header: ${c.header ? "Yes" : "No"}`,
          type: "switch",
        },
        {
          condition: (c) => c.file_type === "csv" && c._moreOptions,
          key: "null_value",
          label: "Null value",
          type: "field",
        },
        {
          condition: (c) => c.file_type === "csv" && c._moreOptions,
          key: "sep",
          label: "Separator",
          type: "field",
        },
        {
          condition: (c) => c.file_type === "csv" && c._moreOptions,
          key: "charset",
          label: "File encoding",
          type: "select",
          items: [
            { text: "Unicode (UTF-8)", value: "UTF-8" },
            { text: "English (ASCII)", value: "ASCII" },
            { text: "Baltic (ISO-8859-4)", value: "ISO-8859-4" },
            { text: "Baltic (ISO-8859-13)", value: "ISO-8859-13" },
            { text: "Baltic (Windows-1257)", value: "Windows-1257" },
            { text: "Celtic (ISO-8859-14)", value: "ISO-8859-14" },
            { text: "Central European (ISO-8859-2)", value: "ISO-8859-2" },
            { text: "Central European (Windows-1250)", value: "Windows-1250" },
            { text: "Chinese Traditional (BIG5)", value: "BIG5" },
            { text: "Chinese Simplified (GB18030)", value: "GB18030" },
            { text: "Chinese Simplified (GB2312)", value: "GB2312" },
            { text: "Cyrillic (ISO-8859-5)", value: "ISO-8859-5" },
            { text: "Cyrillic (Windows-1251)", value: "Windows-1251" },
            { text: "Cyrillic (KOI8-R)", value: "KOI8-R" },
            { text: "Cyrillic (KOI8—U)", value: "KOI8—U" },
            { text: "Cyrillic (IBM866)", value: "IBM866" },
            { text: "Greek (ISO-8859-7)", value: "ISO-8859-7" },
            { text: "Greek (Windows-1253)", value: "Windows-1253" },
            { text: "Japanese (ISO-2022-JP)", value: "ISO-2022-JP" },
            { text: "Japanese (Shift-JIS)", value: "Shift-JIS" },
            { text: "Japanese (EUC-JP)", value: "EUC-JP" },
            { text: "Japanese (cp932)", value: "cp932" },
            { text: "Korean (ISO-2022-KR)", value: "ISO-2022-KR" },
            { text: "Korean (EUC—KR)", value: "EUC—KR" },
            { text: "Latin", value: "latin1" },
            { text: "Nordic (ISO-8859-10)", value: "ISO-8859-10" },
            { text: "Thai (ISO-8859-11)", value: "ISO-8859-11" },
            { text: "Turkish (ISO-8859-9)", value: "ISO-8859-9" },
            { text: "Vietnamese (Windows-1258)", value: "Windows-1258" },
            { text: "Western (ISO-8859-1)", value: "ISO-8859-1" },
            { text: "Western (ISO-8859-3)", value: "ISO-8859-3" },
            { text: "Western (Windows-1252)", value: "Windows-1252" },
          ],
        },
        {
          condition: (c) => c.file_type === "json" && c._moreOptions,
          key: "multiline",
          label: (c) => `Multiline: ${c.multiline ? "Yes" : "No"}`,
          type: "switch",
        },
        {
          condition: (c) => {
            return (
              (c.file_type === "xls" && c._moreOptions) ||
              ((!c._moreOptions || c.file_type === "file") &&
                (c.url.endsWith(".xls") ||
                  c.url.endsWith(".xlsx") ||
                  c.external_url.endsWith(".xls") ||
                  c.external_url.endsWith(".xlsx")))
            );
          },
          key: "sheet_name",
          label: `Sheet`,
          items_key: "_sheet_names",
          type: (c) => (c._sheet_names.length ? "select" : "number"),
        },
      ],
      validate: (c) => {
        if (c.external_url === "" && c.url === "") {
          return 0;
        }
        return !!(c.file_type != "csv" || c.sep);
      },
    },

    clearFile: (currentCommand) => {
      currentCommand._fileType = false;
      currentCommand._fileUploading = false;
      currentCommand._fileInput = [];
      currentCommand._fileName = "";
      currentCommand._meta = false;
      currentCommand._datasetName = false;
      currentCommand._fileLoaded = false;
      currentCommand.error = false;
      currentCommand.url = "";
      currentCommand._fileUploadingProgress = 0;
    },

    uploadFile: async (currentCommand, args, methods) => {
      try {
        currentCommand._fileUploading = true;

        currentCommand._fileUploadingProgress = 0;

        var attachment = {
          setProgress: (progress) => {
            methods.vueSet(currentCommand, "_fileUploadingProgress", progress);
          },
        };

        var response = await methods.storeDispatch("request/uploadFile", {
          file: currentCommand._fileInput,
          attachment,
        });

        if (response.fileType) {
          currentCommand.file_type = response.fileType;
        }
        currentCommand.url = response.fileUrl;
        currentCommand._fileUploading = false;
        currentCommand._datasetName = response.datasetName || false;
        currentCommand._fileLoaded = currentCommand._fileInput;
      } catch (error) {
        console.error(error);
        currentCommand.error = error;
        currentCommand._fileUploading = false;
      }
      return currentCommand;
    },

    payload: () => ({
      command: "loadFile",
      _fileType: false,
      _fileUploading: false,
      _fileInput: [],
      _fileName: "",
      _fileLoaded: false,
      _moreOptions: false,
      file_type: "file",
      external_url: "",
      url: "",
      sep: ",",
      null_value: "null",
      sheet_name: 0,
      header: true,
      limit: "",
      multiline: true,
      charset: "UTF-8",
      _meta: false,
      _datasetName: false,
      _sheet_names: 1,
      preview: {
        loadPreview: true,
        type: "load",
        delay: 500,
      },
      request: {
        isLoad: true,
        createsNew: true,
      },
    }),

    content: (payload) => {
      var infer = payload.file_type === "file" || !payload._moreOptions;
      var fileType = infer ? payload._fileType : payload.file_type;
      var fileName = payload._fileName;
      return (
        `<b>Load</b>` +
        (fileName ? ` ${hlParam(fileName)}` : "") +
        (!fileName && fileType ? ` ${fileType}` : "") +
        " file"
      );
    },
  },

  loadDatabaseTable: {
    dialog: {
      title: "Connect a database",
      testLabel: "connect",
      fields: [
        {
          key: "_connection",
          type: "connection",
          include: "databases",
        },
        {
          key: "table",
          type: "select",
          label: "Table",
          items_key: "tables",
        },
        {
          type: "action",
          label: "Get tables",
          loading: "_loadingTables",
          func: "getTables",
        },
      ],
      validate: (command) =>
        command._connection &&
        command._connection == command.validConnection &&
        command.table,
    },
    payload: () => ({
      command: "loadDatabaseTable",
      _loadingTables: false,
      request: {
        isLoad: true,
        createsNew: true,
      },
    }),
    content: (payload) => {
      var database = [
        "postgres",
        "presto",
        "redshift",
        "microsoftsql",
        "mysql",
      ].includes(payload.driver);
      return (
        `<b>Load</b> ${hlParam(payload.table)}` +
        (database ? ` from ${hlParam(payload.database)}` : "") +
        " to " +
        hlParam(payload.newDfName)
      );
    },

    getTables: async (currentCommand, args, methods) => {
      currentCommand._loadingTables = true;
      currentCommand.error = "";

      try {
        var driver = escapeQuotes(currentCommand.driver);

        var response = await methods.evalCode({
          command: "getDatabaseTables",
          _connection: currentCommand._connection,
        });

        if (response.data.status === "error") {
          throw response.data.error;
        }

        var tables = response.data.result;

        if (!tables || !tables.length) {
          throw "Database has no tables";
        }

        methods.storeCommit("database", true);

        currentCommand = {
          ...currentCommand,
          validConnection: currentCommand._connection,
          tables,
          table: tables[0],
        };
      } catch (err) {
        var _error = printError(err);
        currentCommand.error = _error;
      }

      currentCommand._loadingTables = false;

      return currentCommand;
    },
  },

  /* save */

  saveFile: {
    dialog: {
      title: "Save dataset to file",
      fields: [
        {
          key: "_engineProcessing",
          label: (c) => `Process again: ${c._engineProcessing ? "Yes" : "No"}`,
          type: "switch",
          condition: (c) => ["spark", "ibis"].includes(c.request.engine),
        },
        {
          key: "_connection",
          type: "connection",
          include: "remotes",
        },
        {
          key: "url",
          label: "Url",
          placeholder: "s3://bucket/file or hdfs://bucket/file",
          type: "field",
        },
      ],
      validate: (c) => {
        if (c.url) {
          var file_type = c.url.split(".");
          file_type = file_type[file_type.length - 1];
          return ["csv", "xls", "json", "avro", "parquet"].includes(file_type);
        }
        return false;
      },
    },
    payload: () => ({
      command: "saveFile",
      _engineProcessing: false,
      url: "",
      request: {
        isSave: true,
      },
    }),
    content: (payload) => {
      return `<b>Saved</b> <span class="hint--df">${hlParam(
        payload.dfName
      )} </span>to ${hlParam(payload.url)}`;
    },
  },

  saveDatabaseTable: {
    dialog: {
      title: "Save dataset to database",
      fields: [
        {
          type: "connection",
          key: "_connection",
          include: "databases",
        },
        {
          type: "field",
          key: "table_name",
          label: "Table name",
        },
      ],
      validate: (c) => c.table_name && c._connection,
    },
    payload: () => ({
      command: "saveDatabaseTable",
      table_name: "",
      request: {
        isSave: true,
      },
    }),
    content: (payload) => {
      return `<b>Saved</b><span class="hint--df"> ${hlParam(
        payload.dfName
      )}</span> to ${hlParam(payload.table_name)}`;
    },
  },

  /* operations */

  applySort: {
    content: (payload) => {
      return `<b>Reorder</b> columns`;
    },
  },

  DROP_KEEP: {
    content: (payload) =>
      `<b>${capitalizeString(payload.command)}</b> ${multipleContent(
        [payload.columns],
        "hl--cols"
      )}`,
  },

  sortRows: {
    dialog: {
      title: "Sort rows",
      text: (c) => {
        return `Sort rows in ${arrayJoin(c.columns)}`;
      },
      fields: [
        {
          key: "orders",
          label: "Order",
          type: "select-foreach",
          items: [
            { text: "Ascending", value: "asc" },
            { text: "Descending", value: "desc" },
          ],
        },
      ],
    },

    payload: (columns, payload = {}) => ({
      columns,
      orders: columns.map((e) => "asc"),
    }),

    content: (payload) => {
      return `<b>Sort rows</b> in ${multipleContent(
        [payload.columns, payload.orders],
        ["hl--cols", "hl--param"]
      )}`;
    },
  },

  REMOVE_KEEP_SET: {
    dialog: {
      title: (c) => `Filter / Set ${c.rowsLabels[c.rowsType]}`,
      fields: [
        {
          key: "action",
          label: "Action",
          type: "select",
          items: (c) => {
            var rt = c.rowsLabels[c.rowsType];
            var al = c.actionLabels;
            return [
              { text: `${al.drop} ${rt}`, value: "drop" },
              { text: `${al.select} ${rt}`, value: "select" },
              { text: `${al.set} ${rt}`, value: "set" },
            ];
          },
        },
        {
          condition: (c) => c.action === "set",
          type: "field-suggestions",
          key: "value",
          placeholder: 'Formula or "value"',
          label: "Formula",
          mono: true,
          useFunctions: true,
          fuzzySearch: true,
          suggestions: (c) => ({ column: c.allColumns }),
        },
      ],
      filteredPreview: true,
    },
    payload: (columns, payload = {}) => {
      var rowsType = "missing";

      return {
        columns,
        action: "drop",
        value: "",
        selection: [],

        preview: {
          expectedColumns: (c) => +(c.action === "set"),
          type: "REMOVE_KEEP_SET",
          filteredPreview: false,
          highlightColor: (c) => (c.action === "drop" ? "red" : "green"),
          noBufferWindow: (c) => c.preview.filteredPreview,
        },

        rowsType: "missing", // missing / mismatch / values / ranges
        actionLabels: {
          drop: "Remove",
          select: "Keep",
          set: "Set",
        },
        rowsLabels: {
          missing: "missing rows",
          mismatch: "mismatch rows",
          values: "matching rows",
          ranges: "matching rows",
        },
      };
    },
    content: (payload) => {
      var values = payload.selection;
      var str = "";

      var rt = payload.rowsLabels[payload.rowsType];
      var al = payload.actionLabels[payload.action];
      var str = `<b>${al}</b>`;

      var cols = multipleContent([payload.columns], "hl--cols");

      switch (payload.rowsType) {
        case "ranges":
          values = payload.selection[0].map((col, i) =>
            payload.selection.map((row) => row[i])
          );
          str += ` rows where ${cols} is between ${multipleContent(
            values || [],
            "hl--param",
            ", ",
            " and ",
            false,
            false
          )}`;
          break;
        case "values":
          if (values.length > 1) {
            str += ` rows where ${cols} is one of ${multipleContent(
              [values || []],
              "hl--param"
            )}`;
          } else {
            str += ` rows where ${cols} is ${multipleContent(
              [values || []],
              "hl--param"
            )}`;
          }
          break;
        case "missing":
          str += " missing rows on " + cols;
          break;
        case "mismatch":
          str += " mismatch rows on " + cols;
          break;
        default:
          break;
      }

      if (payload.action === "set") {
        str += ` to ${hlParam(payload.value)}`;
      }

      return str;
    },
  },

  filterRows: {
    dialog: {
      title: "Filter rows",
      text: (c) => `In column "${c.columns[0]}"`,
      fields: [
        {
          key: "condition",
          label: "Condition",
          type: "select",
          items: (c) => [
            { text: "Is exactly", value: "exactly" },
            { text: "Is one of", value: "oneof" },
            { text: "Is not", value: "not" },
            { divider: true },
            {
              text: "Less than or equal to",
              value: "less",
              disabled: c.request.isString,
            },
            {
              text: "Greater than or equal to",
              value: "greater",
              disabled: c.request.isString,
            },
            {
              text: "Is Between",
              value: "between",
              disabled: c.request.isString,
            },
            { divider: true },
            { text: "Contains", value: "contains" },
            { text: "Starts with", value: "starts_with" },
            { text: "Ends with", value: "ends_with" },
            { divider: true },
            { text: "Custom expression", value: "custom" },
            { text: "Pattern", value: "pattern" },
            { text: "Selected", value: "selected", disabled: true },
            { divider: true },
            { text: "Mismatches values", value: "mismatch" },
            { text: "Null values", value: "null" },
          ],
        },
        {
          condition: (c) =>
            ["exactly", "not", "less", "greater"].includes(c.condition),
          key: "value",
          placeholder: (c) =>
            c.request.isString ? "Value" : 'numeric or "string"',
          label: "Value",
          type: "field",
        },
        {
          condition: (c) => c.condition === "pattern",
          key: "value",
          placeholder: "",
          label: "Pattern",
          type: "field",
          mono: true,
        },
        {
          condition: (c) => "oneof" == c.condition,
          key: "values",
          placeholder: "Values",
          label: "Values",
          type: "chips",
          clearable: true,
        },
        {
          condition: (c) => "between" == c.condition,
          key: "value",
          label: "Min value",
          placeholder: "0",
          type: "number",
        },
        {
          condition: (c) => "between" == c.condition,
          key: "value_2",
          label: "Max value",
          placeholder: "1",
          type: "number",
        },
        {
          condition: (c) => "custom" == c.condition,
          key: "expression",
          label: "Expression",
          placeholder: "column>=0",
          type: "field",
          mono: true,
        },
        {
          condition: (c) =>
            ["contains", "starts_with", "ends_with"].includes(c.condition),
          key: "text",
          label: "Text",
          placeholder: "lorem ipsum",
          type: "field",
        },
        {
          key: "action",
          label: "Action",
          type: "select",
          items: [
            { text: "Keep matching rows", value: "select" },
            { text: "Drop matching rows", value: "drop" },
          ],
        },
      ],
      filteredPreview: true,
      validate: (c) => {
        switch (c.condition) {
          case "oneof":
            return c.values.length;
          case "exactly":
          case "not":
          case "less":
          case "greater":
          case "pattern":
            return c.value.length;
          case "between":
            return c.value.length && c.value_2.length;
          case "contains":
          case "starts_with":
          case "ends_with":
            return c.text.length;
          case "custom":
            return c.expression.length;
          case "selected":
          case "null":
          case "mismatch":
            return true;
          default:
            return false;
        }
      },
    },

    payload: (columns, payload = {}) => {
      var condition = "exactly";

      return {
        columns,
        condition,
        action: "select",
        value: "",
        value_2: "",
        values: [],
        text: "",
        expression: columns[0].includes(" ") ? `{${columns[0]}}` : columns[0],

        request: {},

        preview: {
          filteredPreview: false,
          noBufferWindow: (c) => c.preview.filteredPreview,
          highlightColor: (c) => (c.action === "drop" ? "red" : "green"),
          expectedColumns: 0,
          type: "filterRows",
        },
      };
    },

    content: (payload) => {
      var condition;
      var value = undefined;
      var action = payload.action == "drop" ? "Drop" : "Keep";
      var str = `<b>${action}</b> rows where ${multipleContent(
        [payload.columns],
        "hl--cols"
      )} `;

      condition = payload.condition;

      switch (condition) {
        case "null":
          condition = "is null";
          value = false;
          break;
        case "mismatch":
          condition = "is mismatch";
          value = false;
          break;
        case "exactly":
          condition = "is exactly ";
          break;
        case "oneof":
          condition = "is in ";
          value = payload.values;
          break;
        case "not":
          condition = "is not ";
          break;
        case "less":
          condition = "is less than or equal to ";
          break;
        case "greater":
          condition = "is greater than or equal to ";
          break;
        case "contains":
          condition = "contains ";
          value = [payload.text];
          break;
        case "starts_with":
          condition = "starts with ";
          value = [payload.text];
          break;
        case "pattern":
          condition = "with pattern ";
          value = [payload.value];
          break;
        case "ends_with":
          condition = "ends with ";
          value = [payload.text];
          break;
        case "between":
          value = value || [[payload.value], [payload.value_2]];
          break;
        case "custom":
          condition = "matches ";
          value = payload.expression;
      }

      value = value !== false ? value || payload.value : false;

      switch (condition) {
        case "oneof":
          str += "is one of " + multipleContent([value || []], "hl--param");
          break;
        case "between":
          str += "is between " + multipleContent([value || []], "hl--param");
          break;
        default:
          str +=
            condition +
            (value !== false
              ? multipleContent([value || []], "hl--param")
              : "");
      }
      return str;
    },
  },

  dropEmptyRows: {
    dialog: {
      title: (command) =>
        command.subset.length ? "Drop empty rows in subset" : "Drop empty rows",
      fields: [
        {
          key: "how",
          label: "Drop when",
          type: "select",
          items: [
            { text: "Every cell is null", value: "all" },
            { text: "Any cell is null", value: "any" },
          ],
        },
      ],
      filteredPreview: true,
    },
    payload: (columns, payload = {}) => ({
      subset: columns,
      how: "all",
      preview: {
        filteredPreview: false,
        type: "dropEmptyRows",
        highlightColor: "red",
        noBufferWindow: (c) => c.preview.filteredPreview,
      },
      request: {},
    }),
    content: (payload) => {
      var str =
        payload.how === "all"
          ? `<b>Drop empty rows</b>`
          : `<b>Drop rows with empty values</b>`;
      return (
        str +
        (payload.subset.length
          ? ` in ${multipleContent([payload.subset], "hl--cols")}`
          : "")
      );
    },
  },

  dropDuplicates: {
    dialog: {
      title: (command) =>
        command.subset.length
          ? "Drop duplicates using subset"
          : "Drop duplicates",
      fields: [
        {
          key: "keep",
          label: "Keep",
          type: "select",
          items: [
            { text: "First match", value: "first" },
            { text: "Last match", value: "last" },
          ],
        },
      ],
      filteredPreview: true,
    },
    payload: (columns, payload = {}) => ({
      subset: columns,
      keep: "first",
      preview: {
        type: "dropDuplicates",
        highlightColor: "red",
        filteredPreview: false,
        noBufferWindow: (c) => c.preview.filteredPreview,
      },
      request: {},
    }),
    content: (payload) =>
      `<b>Drop duplicated rows</b>` +
      (payload.subset.length
        ? ` in ${multipleContent([payload.subset], "hl--cols")}`
        : ""),
  },

  join: {
    dialog: {
      title: "Join datasets",
      fields: [
        {
          key: "how",
          label: "Join type",
          type: "select",
          items: [
            { text: "Inner join", value: "inner" },
            { text: "Left join", value: "left" },
            { text: "Right join", value: "right" },
            { text: "Outer join", value: "outer" },
          ],
        },
        {
          key: "with",
          label: "Dataset (right)",
          type: "select",
          items_key: "items_with",
          onChange: (event, currentCommand) => {
            for (
              let i = currentCommand.selected_columns.length - 1;
              i >= 0;
              i--
            ) {
              if (currentCommand.selected_columns[i].source === "right") {
                currentCommand.selected_columns.splice(i, 1);
              }
            }

            currentCommand.right_on = false;

            currentCommand.selected_columns = [
              ...currentCommand.selected_columns,
              ...(
                currentCommand.secondaryDatasets[currentCommand.with].columns ||
                []
              ).map((name) => ({ name, source: "right", key: name + "r" })),
            ];

            var items = getProperty(currentCommand.items_r_on, [
              currentCommand,
            ]);
            currentCommand.right_on = items ? items[0] || false : false;
            return currentCommand;
          },
        },
        {
          key: "selected_columns",
          label: "Filter columns",
          item_key: "key",
          type: "columns_filter",
          items_key: "items_selected_columns",
          headers: [
            {
              text: "",
              sortable: false,
              align: "center",
              class: "pa-0",
              value: "key",
              width: 12,
            },
            {
              text: "Column",
              sortable: true,
              align: "start",
              value: "name",
            },
            {
              text: "Source",
              value: "source",
            },
          ],
          onClickRow: (currentCommand, args, methods) => {
            let item = args[0];
            let found = currentCommand.selected_columns.findIndex(
              (it) => it.key === item.key
            );
            if (found === -1) {
              currentCommand.selected_columns.push(item);
            } else {
              methods.vueDelete(currentCommand.selected_columns, found);
            }
            return currentCommand;
          },
          selectKey: (currentCommand, args, methods) => {
            let item = args[0];

            try {
              let on = item.source + "_on";
              currentCommand[on] = item.name;
            } catch (error) {
              console.error(error);
            }

            return currentCommand;
          },
        },
      ],
      validate: (c) => {
        return !!(
          c.selected_columns &&
          c.selected_columns.length &&
          c.right_on
        );
      },
    },
    payload: async (columns, payload = {}) => {
      var items_with = Object.keys(payload.secondaryDatasets).filter(
        (e) => e !== payload.dfName && e !== "preview_df"
      );

      var df2 = items_with[0];

      return {
        how: "inner",
        _unselect_on_change: {
          left: [],
          right: [],
        },
        left_on: payload.allColumns[0],
        items_l_on: payload.allColumns,
        right_on: [],

        items_r_on: (c) => c.secondaryDatasets[c.with].columns,
        with: df2,
        items_with: (c) => {
          return Object.keys(c.secondaryDatasets)
            .filter((e) => e !== payload.dfName && e !== "preview_df")
            .filter((e) => !e.startsWith("_"));
        },
        items_selected_columns: (c) => {
          try {
            return [
              ...(c.allColumns || []).map((n) => ({
                name: n,
                source: "left",
                key: n + "l",
              })),
              ...c.secondaryDatasets[c.with].columns.map((n) => ({
                name: n,
                source: "right",
                key: n + "r",
              })),
            ];
          } catch (err) {}
        },
        selected_columns: [],
        preview: {
          joinPreview: (c) => {
            var left = c.selected_columns
              .filter((col) => col.source === "left" && col.name !== c.left_on)
              .map((col) => col.name);
            left = [...left, ...left.map((n) => n + "_left")];
            var right = c.selected_columns
              .filter(
                (col) => col.source === "right" && col.name !== c.right_on
              )
              .map((col) => col.name);
            right = [...right, ...right.map((n) => n + "_right")];
            var center = [
              c.left_on,
              c.right_on,
              c.left_on + c.right_on,
              c.left_on + "_" + c.right_on,
            ];
            return [left, center, right];
          },
          expectedColumns: -1,
          type: "join",
          delay: 500,
          datasetPreview: true,
          noBufferWindow: true,
        },
        request: {
          // createsNew: true
        },
      };
    },
    onInit: async (currentCommand, args, methods) => {
      var command = deepCopy(currentCommand);

      var dfNames = Object.keys(command.secondaryDatasets);

      for (let i = 0; i < dfNames.length; i++) {
        var dfName = dfNames[i];
        command.secondaryDatasets[
          dfName
        ].columns = await methods.datasetColumns(dfName);
      }

      command.right_on = command.secondaryDatasets[command.with].columns[0];
      command.selected_columns = [
        ...(command.allColumns || []).map((name) => ({
          name,
          source: "left",
          key: name + "l",
        })),
        ...(
          command.secondaryDatasets[command.with].columns || []
        ).map((name) => ({ name, source: "right", key: name + "r" })),
      ];

      return command;
    },

    beforeExecuteCode: async (currentCommand, args, methods) => {
      var command = deepCopy(currentCommand);

      var dfNames = Object.keys(command.secondaryDatasets);

      for (let i = 0; i < dfNames.length; i++) {
        var dfName = dfNames[i];
        command.secondaryDatasets[
          dfName
        ].columns = await methods.datasetColumns(dfName);
      }

      return command;
    },
    content: (payload) =>
      `<b>Join</b> ${hlParam(payload.dfName)} <b>with</b> ${hlParam(
        payload.with
      )}`,
  },

  concat: {
    dialog: {
      dialog: true,
      dynamicClass: (c) => (c.showValues ? "values-items" : ""),
      class: "bigger-dialog concat-dialog",
      tall: true,
      title: "Append datasets",
      fields: [
        {
          key: "showValues",
          label: "Show values",
          class: "show-values-switch",
          type: "switch",
          condition: (c) => c.typesDone,
        },
        {
          key: "with",
          label: "With datasets",
          type: "tabs",
          item_key: "name",
          items_key: "items_with",
          static_items_key: "static_items",
          info_key: "items_info",
          options: {
            items_name: "dataset",
            value: "name",
            concat: true,
          },
          condition: (c) => c.typesDone,
        },
        {
          key: "selected_columns",
          label: "Concat columns",
          type: "columns_concat",
        },
      ],
      validate: (c) => {
        return !!(
          c.selected_columns &&
          c.selected_columns.length &&
          c.with.length
        );
      },
    },
    payload: async (columns, payload = {}) => {
      var items_with_cb = (c) => {
        return Object.entries(c.secondaryDatasets)
          .filter(
            ([dfName, df]) => dfName !== c.dfName && dfName !== "preview_df"
          )
          .filter(([dfName, df]) => !dfName.startsWith("_"))
          .map(([name, df]) => {
            var length = undefined;
            if (df.columns) {
              length = df.columns.length;
            }
            return { name: name, dfName: name, columns: length };
          });
      };

      return {
        showValues: false,
        items_with: items_with_cb,
        with: [],
        items_info: (c) => {
          try {
            var rows = c.selected_columns.map((e) => e.items);
            if (!rows || !rows.length) {
              return [];
            }
            var columns = transpose(rows).map(
              (columns) => columns.filter((e) => e).length
            );
            var total_columns = [
              ...c.static_items(c).map((e) => e.columns),
              ...c.items_with(c).map((e) => e.columns),
            ];
            return columns.map((e, index) => {
              return `${e} of ${total_columns[index]} columns`;
            });
          } catch (err) {
            console.error(err);
            return [];
          }
        },
        static_items: (c) => {
          var df = c.secondaryDatasets[c.dfName];
          var columns = undefined;

          if (df && df.columns) {
            columns = df.columns.length;
          }

          return [
            {
              name: c.dfName,
              dfName: c.dfName,
              columns,
            },
          ];
        },
        dataset_columns: (c) => {
          try {
            var datasets = c.with.map((dataset) => {
              var types = c.secondaryDatasets[dataset.name]
                ? c.secondaryDatasets[dataset.name].types
                : {};
              var entries = Object.entries(types);
              return entries.map(([name, type]) => ({
                name,
                type,
                value: c.secondaryDatasets[dataset.name].sample[name],
              }));
            });

            var types = c.secondaryDatasets[payload.dfName]
              ? c.secondaryDatasets[payload.dfName].types
              : {};

            var mainEntries = Object.entries(types);

            return [
              mainEntries.map(([name, type]) => ({
                name,
                type,
                value: c.secondaryDatasets[payload.dfName].sample[name],
              })),
              ...datasets,
            ];
          } catch (err) {
            console.error(err);
          }
        },

        selected_columns: [],
        preview: false,
        request: {
          // createsNew: true
        },
      };
    },

    content: (payload) =>
      `<b>Concat</b> ${hlParam(payload.dfName)} <b>with</b> ${hlParam(
        payload.with
      )}`,

    onInit: async (currentCommand, args, methods) => {
      try {
        let command = deepCopy(currentCommand);

        let dfNames = Object.keys(command.secondaryDatasets);

        for (let i = 0; i < dfNames.length; i++) {
          let dfName = dfNames[i];
          command.secondaryDatasets[
            dfName
          ].execute = await methods.datasetExecute(dfName);
          command.secondaryDatasets[
            dfName
          ].columns = await methods.datasetColumns(dfName);
          command.secondaryDatasets[dfName].types = await methods.datasetTypes(
            dfName
          );
          command.secondaryDatasets[
            dfName
          ].sample = await methods.datasetSample(dfName);
        }

        let items_with = command.items_with(command);

        command.with = [items_with[0]];

        command.typesDone = true;

        return command;
      } catch (err) {
        console.error(err);
        return { ...currentCommand, typesDone: true };
      }
    },
  },

  aggregations: {
    dialog: {
      title: "Get aggregations",
      fields: [
        {
          type: "autocomplete",
          key: "group_by",
          label: "Group by",
          clearable: true,
          items_key: "allColumns",
        },
        {
          type: "text",
          text: "Aggregations",
        },
        {
          type: "repeat",
          key: "aggregations",
          add: true,
          addOne: (c) => {
            c.input_cols.push(c.allColumns[0]);
            c.aggregations.push("count");
            c.output_cols.push("");

            return c;
          },
          removeOne: (c, i) => {
            c.input_cols.splice(i, 1);
            c.aggregations.splice(i, 1);
            c.output_cols.splice(i, 1);
            return c;
          },
          fields: [
            {
              type: "select",
              key: "input_cols",
              label: "Column",
              class: "half-with-btn",
              items_key: "allColumns",
            },
            {
              type: "select",
              class: "half-with-btn",
              key: "aggregations",
              label: "Type",
              items: [
                { text: "Count", value: "count" },
                { text: "Sum", value: "sum" },
                { text: "Mean", value: "mean" },
                { text: "Std", value: "std" },
                { text: "Min", value: "min" },
                { text: "Max", value: "max" },
                { text: "First", value: "first" },
                { text: "Last", value: "last" },
              ],
            },
            // {
            //   type: 'field',
            //  // class: 'with-icon-btn',
            //   label: 'Rename',
            //   placeholder: (c,i)=>aggOutputCols(c)[i],
            //   key: 'output_cols'
            // },
          ],
        },
      ],
      validate: (c) => {
        if (c.group_by.length == 0) {
          return 0;
        }
        return c.input_cols.length && c.aggregations.length;
      },
    },
    payload: (columns, payload = {}) => ({
      group_by: [],
      input_cols: columns,
      aggregations: columns.map((e) => "count"),
      output_cols: columns.map((e) => ""),
      preview: {
        type: "aggregations",
        expectedColumns: (c) => {
          var output_cols_default = aggOutputCols(c);
          var aggregations = c.aggregations.map(
            (oname, i) =>
              `"${c.output_cols[i] || output_cols_default[i]}": {"${
                c.input_cols[i]
              }":"${c.aggregations[i]}"}`
          );
          aggregations = [...new Set(aggregations)];
          return aggregations.length + c.group_by.length;
        },
        datasetPreview: true,
        noBufferWindow: true,
      },
      request: {},
    }),
    content: (payload) =>
      `<b>Group by</b> ${multipleContent(
        [payload.group_by],
        "hl--cols"
      )} <b>aggregate</b> ${multipleContent(
        [payload.input_cols, payload.aggregations],
        ["hl--cols", "hl--param"],
        ", ",
        " using ",
        false,
        false
      )}`,
  },

  GENERIC_OLD: {
    dialog: {
      title: (c) => c.title || c.content || c.command,
      output_cols: true,
    },
    payload: (columns, payload = {}) => ({
      columns: columns,
      output_cols: columns.map((e) => ""),
      title: payload.title,
      content: payload.content,
      preview: {
        type: "GENERIC_OLD",
      },
    }),
    content: (payload) => {
      return `<b>${payload.content || payload.command}</b> ${multipleContent(
        [payload.columns],
        "hl--cols"
      )}`;
    },
  },

  GENERIC: {
    dialog: {
      title: (c) => c.title || c.content || c.command,
      fields: (c) => {
        return Object.entries(c.parameters || {}).map(([key, param]) => ({
          label: param.label,
          key,
          type: param.formType || (param.type == "int" ? "number" : "field"),
        }));
      },
      output_cols: true,
    },
    payload: (columns, payload = {}) => {
      let parameters = objectMap(
        payload.parameters || {},
        ([name, value]) => value.value
      );

      return {
        ...parameters,
        columns: columns,
        output_cols: columns.map((e) => ""),
        title: payload.title,
        content: payload.content,
        preview: {
          type: "GENERIC",
        },
      };
    },
    content: (payload) => {
      let using = "";

      let parameters = Object.keys(payload.parameters || {}).map(
        (parameter) => {
          return `${multipleContent(
            [payload[parameter]],
            "hl--param"
          )} as ${multipleContent([parameter], "hl--param")}`;
        }
      );

      if (parameters.length) {
        using = " using " + parameters.join(", ");
      }
      return `<b>${payload.content || payload.command}</b> ${multipleContent(
        [payload.columns],
        "hl--cols"
      )}${using}`;
    },
  },

  SUBSTR1: {
    dialog: {
      title: (c) => {
        return {
          left_string: "Substring (left)",
          right_string: "Substring (right)",
        }[c.command];
      },
      output_cols: true,
      fields: [
        {
          type: "number",
          label: "Characters to show",
          key: "n",
        },
      ],
      validate: (command) => command.n,
    },
    payload: (columns, payload = {}) => ({
      columns: columns,
      output_cols: columns.map((e) => ""),
      n: "",
      preview: {
        type: "SUBSTR1",
      },
    }),
    content: (payload) => {
      var str = {
        left_string: "Substring (left)",
        right_string: "Substring (right)",
      };
      return `<b>${str[payload.command]}</b> ${multipleContent(
        [payload.columns],
        "hl--cols"
      )} using ${hlParam(payload.n)} characters`;
    },
  },

  mid_string: {
    dialog: {
      title: "Substring",
      output_cols: true,
      fields: [
        {
          type: "number",
          label: "Start at",
          key: "start",
        },
        {
          type: "number",
          label: "Characters to show",
          key: "n",
        },
      ],
      validate: (command) => command.n && command.start !== "",
    },
    payload: (columns, payload = {}) => ({
      columns: columns,
      output_cols: columns.map((e) => ""),
      start: 0,
      n: "",
      preview: {
        type: "mid_string",
      },
    }),
    content: (payload) => {
      return `<b>Substring</b> ${multipleContent(
        [payload.columns],
        "hl--cols"
      )} using ${hlParam(payload.n)} characters starting from ${hlParam(
        payload.start
      )}`;
    },
  },

  pad_string: {
    dialog: {
      title: "Pad",
      output_cols: true,
      fields: [
        {
          type: "number",
          label: "Minimum length",
          key: "width",
        },
        {
          type: "field",
          label: "Pad string",
          key: "fillchar",
        },
        {
          type: "select",
          label: "Side",
          key: "side",
          items: [
            { text: "Left", value: "left" },
            { text: "Right", value: "right" },
            { text: "Both", value: "both" },
          ],
        },
      ],
      validate: (command) => command.width && command.fillchar !== "",
    },
    payload: (columns, payload = {}) => ({
      columns: columns,
      output_cols: columns.map((e) => ""),
      width: 6,
      fillchar: "0",
      side: "left",
      preview: {
        type: "pad_string",
      },
    }),
    content: (payload) => {
      return `<b>Pad</b> ${multipleContent(
        [payload.columns],
        "hl--cols"
      )} to ${hlParam(payload.width)} characters from the ${hlParam(
        payload.side
      )} using ${hlParam(payload.fillchar)}`;
    },
  },

  extract: {
    dialog: {
      title: "Extract",
      output_cols: true,
      fields: [
        {
          type: "field",
          label: "Expression",
          key: "regex",
        },
      ],
      validate: (command) => command.regex !== "",
    },
    payload: (columns, payload = {}) => ({
      columns: columns,
      output_cols: columns.map((e) => ""),
      regex: "",
      preview: {
        type: "extract",
      },
    }),
    content: (payload) => {
      return `<b>Extract</b> ${hlParam(payload.regex)} from ${multipleContent(
        [payload.columns],
        "hl--cols"
      )}`;
    },
  },

  set_dtype: {
    content: (payload) =>
      `<b>Set data type</b> ${multipleContent(
        [payload.columns],
        "hl--cols"
      )} to ${multipleContent([payload.dtype], "hl--param")}`,
  },

  fill_na: {
    dialog: {
      title: (command) =>
        "Fill in " + (command.columns.length == 1 ? `column` : "columns"),
      text: (command) => {
        return (
          `Fill "${command.fill}"` +
          (command.columns.length == 1 ? ` in ${command.columns[0]}` : "")
        );
      },
      output_cols: true,
      fields: [
        {
          type: "field",
          label: "Fill",
          key: "fill",
        },
      ],
      validate: (command) => command.fill !== "",
    },
    payload: (columns, payload = {}) => ({
      command: "fill_na",
      columns: columns,
      fill: "",
      output_cols: columns.map((e) => ""),
      preview: {
        type: "fill_na",
      },
    }),
    content: (payload) =>
      `<b>Fill empty cells</b> in ${multipleContent(
        [payload.columns],
        "hl--cols"
      )} with ${hlParam(payload.fill)}`,
  },

  stringClustering: {
    dialog: {
      dialog: true,
      tall: true,
      title: "String clustering",
      acceptLabel: "Merge",
      fields: [
        {
          type: "select",
          key: "algorithm",
          label: "Algorithm",
          items: [
            { text: "Fingerprint", value: "fingerprint" },
            { text: "N-gram fingerprint", value: "n_gram_fingerprint" },
          ],
        },
        {
          condition: (c) => c.algorithm == "n_gram_fingerprint",
          type: "number",
          label: "N size",
          key: "n_size",
        },
        {
          type: "action",
          label: "Get clusters",
          func: "getClusters",
          validate: (c) =>
            c.algorithm != c.valid.algorithm ||
            (c.n_size != c.valid.n_size && c.algorithm == "n_gram_fingerprint"),
        },
        {
          type: "clusters",
          key: "clusters",
        },
      ],
      validate: (c) => {
        if (c.algorithm == "n_gram_fingerprint")
          return (
            c.clusters &&
            c.clusters.filter((e) => e.selected.length).length &&
            c.n_size
          );
        else
          return (
            c.clusters && c.clusters.filter((e) => e.selected.length).length
          );
      },
    },
    getClusters: async (currentCommand, args, methods) => {
      try {
        var codePayload;

        if (currentCommand.algorithm == "fingerprint") {
          codePayload = {
            command: "fingerprint",
            dfName: currentCommand.dfName,
            columns: currentCommand.columns,
          };
        } else if (currentCommand.algorithm == "n_gram_fingerprint") {
          codePayload = {
            command: "n_gram_fingerprint",
            dfName: currentCommand.dfName,
            columns: currentCommand.columns,
            n_size: currentCommand.n_size,
          };
        } else {
          throw new Error("Invalid algorithm type input");
        }

        currentCommand._loading = 'block';
        currentCommand.clusters = false;
        currentCommand.error = false;

        var response = await methods.evalCode(codePayload);

        if (
          !response ||
          !response.data ||
          !response.data.result ||
          response.data.status == "error"
        ) {
          throw response;
        }

        var clusters = parseResponse(response.data.result);

        if (!clusters) {
          throw response;
        }

        clusters = Object.entries(clusters).map((e) => {
          const cluster_name = e[0];
          const cluster_object = e[1];

          var values = Array.isArray(cluster_object.similar)
            ? cluster_object.similar.map((s) => ({ value: s, count: "1+" }))
            : Object.entries(cluster_object.similar).map((s) => ({
                value: s[0],
                count: s[1],
              }));

          return {
            replace: cluster_name,
            count: Array.isArray(cluster_object.similar)
              ? "1+"
              : cluster_object.sum,
            values,
            selected: [],
          };
        });

        if (!clusters.length) {
          throw "No clusters found";
        }

        currentCommand = {
          ...currentCommand,
          valid: {
            algorithm: currentCommand.algorithm,
            threshold: currentCommand.threshold,
            n_size: currentCommand.n_size,
          },
          clusters,
        };
      } catch (err) {
        var _error = printError(err);
        currentCommand = {
          ...currentCommand,
          error: _error,
          should_update: true,
        };
      }

      currentCommand._loading = false;

      return currentCommand;
    },
    payload: (columns, payload = {}) => {
      return {
        valid: {
          algorithm: undefined,
          n_size: undefined,
          threshold: undefined,
        },
        columns,
        algorithm: "fingerprint",
        clusters: false,
        loading: false,
        n_size: 2,
        threshold: "",
        should_update: false,
      };
    },
    content: (payload) => {
      // TO-DO: Test
      return `<b>Clusterize</b> ${multipleContent(
        [payload.clusters.map((e) => e.replace)],
        "hl--param"
      )} in ${hlCols(payload.columns[0])}`;
    },
  },

  setFormat: {
    dialog: {
      title: "Set date format",
      fields: [
        {
          type: "field",
          key: "output_format",
          label: "Format",
        },
      ],
    },
  },

  transformFormat: {
    dialog: {
      title: "Transform date format",
      fields: [
        {
          type: "field",
          key: "current_format",
          label: "Previous format",
          mono: true,
        },
        {
          type: "field-suggestions",
          key: "output_format",
          label: "New format",
          mono: true,
          useFunctions: false,
          fuzzySearch: false,
          suggestions: (c) => ({
            dateformat: [
              ...new Set([
                ...c.allColumnDateFormats,
                "d-m-Y",
                "d-m-y",
                "d/m/Y",
                "d/m/y",
                "m-d-Y",
                "m-d-y",
                "m/d/Y",
                "m/d/y",
                "Y-m-d",
              ]),
            ],
          }),
        },
      ],
      validate: (c) => c.current_format && c.output_format,
    },
    payload: (columns, payload = {}) => {
      return {
        columns,
        current_format: payload.columnDateFormats[0] || "Y-m-d",
        output_format: "",
        preview: {
          type: "transformFormat",
        },
      };
    },
    content: (payload) =>
      `<b>Date format transformed</b> from ${hlParam(
        payload.current_format
      )} to ${hlParam(payload.output_format)} on ${multipleContent(
        [payload.columns],
        "hl--cols"
      )}`,
  },

  getFromDatetime: {
    dialog: {
      title: (c) => `Get ${TIME_NAMES[c.output_type].split(" (")[0]} from date`,
      output_cols: true,
    },
    payload: (columns, payload = {}) => {
      return {
        columns,
        output_cols: columns.map((e) => ""),
        current_format: payload.columnDateFormats[0] || "Y-m-d",
        output_type: payload.output_type || "year",
        preview: {
          type: "TIME",
        },
      };
    },
    content: (payload) => {
      return `<b>Got</b> ${
        TIME_NAMES[payload.output_type]
      } from ${multipleContent([payload.columns], "hl--cols")}`;
    },
  },

  outliers: {
    dialog: {
      dialog: true,
      title: "Outliers",
      fields: [
        {
          type: "select",
          key: "algorithm",
          label: "Algorithm",
          items: [
            { text: "Tukey", value: "tukey" },
            { text: "Mad", value: "mad" },
            // {text: 'Z score', value: 'z_score'},
            // {text: 'Modified Z score', value: 'modified_z_score'}
          ],
        },
        {
          condition: (c) => c.algorithm == "mad",
          type: "number",
          key: "threshold",
          label: "Threshold",
        },
        {
          type: "action",
          label: "Get outliers",
          func: "getOutliers",
          validate: (c) =>
            c.algorithm != c.valid.algorithm ||
            (c.threshold != c.valid.threshold && c.algorithm == "mad") ||
            !c.data,
        },
        {
          type: "outliers-range",
          key: "data",
          selection_key: "selection",
        },
        {
          condition: (c) => c.data,
          type: "select",
          key: "action",
          label: "Action",
          items: [
            { text: "Drop", value: "Drop" },
            { text: "Keep", value: "Keep" },
            // { text: 'Replace', value: 'replace' }
          ],
        },
        {
          condition: (c) => /*c.data*/ false,
          type: "text",
          big: true,
          text: (c) => {
            var ranges;

            if (c.selection.length > 1) {
              ranges = `some values between ${c.selection[0][0]} and ${
                c.selection[c.selection.length - 1][1]
              }`;
            } else if (c.selection.length == 1) {
              ranges = `values between ${c.selection[0][0]} and ${c.selection[0][1]}`;
            } else {
              ranges = "values";
            }

            return `${c.action} ${ranges} in ${c.columns[0]}`;
          },
        },
      ],
      validate: (c) =>
        c.data &&
        (c.selection.length ||
          ["z_score", "modified_z_score"].includes(c.algorithm)) &&
        !c._loading,
    },
    getOutliers: async (currentCommand, args, methods) => {
      try {
        var code;

        if (currentCommand.algorithm == "tukey")
          code = `outlier = ${currentCommand.dfName}.outliers.tukey("${currentCommand.columns[0]}")`;
        else if (currentCommand.algorithm == "z_score")
          code = `outlier = ${currentCommand.dfName}.outliers.z_score(columns="${currentCommand.columns[0]}", threshold=${currentCommand.threshold})`;
        else if (currentCommand.algorithm == "mad")
          code = `outlier = ${currentCommand.dfName}.outliers.mad(columns="${currentCommand.columns[0]}", threshold=${currentCommand.threshold})`;
        else if (currentCommand.algorithm == "modified_z_score")
          code = `outlier = ${currentCommand.dfName}.outliers.modified_z_score(columns="${currentCommand.columns[0]}", threshold=${currentCommand.threshold})`;
        else throw "Invalid algorithm type input";

        currentCommand._loading = 'block';

        var response = await methods.evalCode(
          `import json; ${code}; _output = json.dumps(outlier.info(), ensure_ascii=False)`
        );

        var outliers_data = parseResponse(response.data.result);

        if (!outliers_data) {
          throw response;
        }

        if (["tukey", "mad"].includes(currentCommand.algorithm)) {
          var hist_response = await methods.evalCode(
            `_output = outlier.hist("${currentCommand.columns[0]}")`
          );
          var hist_data = parseResponse(hist_response.data.result);

          if (!hist_data) {
            throw hist_response;
          }

          var hist = hist_data[currentCommand.columns[0]].hist;

          outliers_data = { ...outliers_data, hist };
        }

        currentCommand = {
          ...currentCommand,
          valid: {
            algorithm: currentCommand.algorithm,
            threshold: currentCommand.threshold,
          },
          data: outliers_data,
          selection: [],
          code_done: code,
        };
      } catch (err) {
        var _error = printError(err);
        currentCommand = {
          ...currentCommand,
          error: _error,
          data: false,
          selection: [],
        };
      }

      currentCommand._loading = false;

      return currentCommand;
    },
    payload: (columns, payload = {}) => {
      return {
        columns,
        algorithm: "tukey",
        threshold: 1,
        valid: {
          algorithm: undefined,
          threshold: undefined,
        },
        data: false,
        selection: [],
        action: "Drop",
        loading: false,
        code_done: "",
      };
    },
    content: (payload) => {
      // TO-DO: Test
      return `<b>${payload.action} outliers</b> (between ${multipleContent(
        payload.selection[0],
        "hl--param",
        ", ",
        " and "
      )})`;
    },
  },

  stratified_sample: {
    dialog: {
      title: "Stratified sampling",
      fields: [
        {
          type: "number",
          key: "seed",
          label: "Seed",
          clearable: true,
        },
      ],
    },
    payload: (columns, payload = {}) => ({
      command: "stratified_sample",
      seed: 1,
      columns: columns,
    }),
    content: (payload) => {
      // TO-DO: Test
      return (
        `<b>Stratified sampling</b> on ${multipleContent(
          [payload.columns],
          "hl--cols"
        )}` + (payload.seed !== "" ? ` using ${hlParam(payload.seed)}` : "")
      );
    },
  },

  replace: {
    dialog: {
      text: (command) => {
        let search = command._search_by_string
          ? `"${command.search}"`
          : command.search;
        let replace = command._replace_by_string
          ? `"${command.replace}"`
          : command.replace;

        replace = replace ? replace : "None";

        return (
          `Replace ${search} by ${replace}` +
          (command.columns.length == 1 ? ` in ${command.columns[0]}` : "")
        );
      },
      fields: [
        {
          type: "chips",
          key: "search",
          label: "Find",
          clearable: true,
        },
        {
          type: "switch",
          key: "match_case",
          label: (c) => "Match case: " + (c.match_case ? "Yes" : "No"),
        },
        {
          type: "field",
          key: "replace",
          label: "Replace",
        },
        {
          type: "select",
          key: "search_by",
          label: "Search by",
          items: [
            { text: "Characters", value: "chars" },
            { text: "Words", value: "words" },
            { text: "Full", value: "full" },
          ],
          onChange: (event, c) => {
            if (c.search_by !== "full" && !c._replace_by_string) {
              c._replace_by_string = true;
            }
            return c;
          },
        },
        {
          type: "switch",
          key: "_search_by_string",
          label: (c) =>
            "Search by string: " + (c._search_by_string ? "Yes" : "No"),
          condition: (c) => c.search_by == "full",
          onChange: (event, c) => {
            if (c._search_by_string && !c._replace_by_string) {
              c._replace_by_string = true;
            }
            return c;
          },
        },
        {
          type: "switch",
          key: "_replace_by_string",
          label: (c) =>
            "Replace by string: " + (c._replace_by_string ? "Yes" : "No"),
          condition: (c) => c.search_by == "full",
        },
      ],
      output_cols: true,
      validate: (command) => {
        if (!command.search.length) {
          return 0;
        }
        return (
          command.output_cols.filter((e) => e !== "").length %
            command.columns.length ===
          0
        );
      },
    },
    payload: (columns, payload = {}) => ({
      command: "replace",
      columns: columns,
      search: [],
      replace: "",
      search_by: "chars",
      output_cols: columns.map((e) => e),
      match_case: false,
      title: "Replace in " + (columns.length == 1 ? `column` : "columns"),
      _replace_by_string: true,
      _search_by_string: true,
      preview: {
        type: "replace",
        highlightColor: { default: "red", preview: "green" },
      },
    }),
    content: (payload) =>
      `<b>Replace</b> ${multipleContent(
        [payload.search],
        "hl--param"
      )} with ${hlParam(payload.replace)} in ${multipleContent(
        [payload.columns],
        "hl--cols"
      )}`,
  },

  set: {
    dialog: {
      fields: [
        {
          type: "field-suggestions",
          key: "value",
          placeholder: 'Formula or "value"',
          label: "Formula",
          mono: true,
          suggestions: (c) => ({ column: c.allColumns }),
          useFunctions: true,
          fuzzySearch: true,
        },
        {
          type: "field",
          key: "output_col",
          label: "Output column",
          condition: (c) => !c.columns.length,
        },
      ],
      output_cols: true,
      validate: (command) => {
        var output_col =
          command.output_cols[0] || command.output_col || command.columns[0];
        return (
          (command.columns[0] || command.value) &&
          (command.columns[0] || output_col) &&
          (command.value || output_col)
        );
      },
    },
    payload: (columns, payload = {}) => {
      var output_col = columns.length ? "" : "new_column";

      return {
        command: "set",
        columns,
        value: columns[0]
          ? columns[0].includes(" ")
            ? `{${columns[0]}}`
            : columns[0]
          : "",
        title: columns[0] ? `Set column` : "Create column",
        preview: {
          expectedColumns: 1,
          type: "set",
        },
        output_col,
        output_cols: columns.map((e) => ""),
      };
    },
    content: (payload) => {
      var output_cols = payload.output_cols;

      if (
        !payload.output_cols.length ||
        (payload.output_cols.length === 1 && !payload.output_cols[0])
      ) {
        output_cols = [payload.output_col || payload.columns[0]];
      }

      var action = "Create";

      var er = everyRatio(
        output_cols,
        (col) => payload.allColumns.indexOf(col) >= 0
      );

      if (er === 1) {
        action = "Set";
      } else if (er > 0) {
        action = "Set / Create";
      }

      return `<b>${action}</b> ${multipleContent(
        [output_cols],
        "hl--cols"
      )} with ${multipleContent([payload.value], "hl--param")}`;
    },
  },

  rename: {
    dialog: {
      title: (command) =>
        "Rename " + (command.columns.length == 1 ? `column` : "columns"),
      output_cols: true,
      output_cols_label: true,
      no_label: true,
      validate: (command) => {
        return (
          command.output_cols.filter((e) => e !== "").length ==
          command.columns.length
        );
      },
    },
    payload: (columns, payload = {}) => {
      return {
        command: "rename",
        columns,
        output_cols: columns.map((e) => newName(e)),
        preview: {
          fake: "rename",
        },
      };
    },
    content: (payload) =>
      `<b>Rename</b> ${multipleContent(
        [payload.columns, payload.output_cols],
        "hl--cols",
        ", ",
        " to ",
        false,
        false
      )}`,
  },

  unnest: {
    dialog: {
      title: (command) =>
        "Unnest " + (command.columns.length == 1 ? `column` : "columns"),
      output_cols: true,
      output_cols_label: "Output columns name",
      fields: [
        {
          type: "field",
          key: "separator",
          label: "Separator",
        },
        {
          type: "number",
          key: "splits",
          label: "Splits",
          clearable: true,
          min: 2,
        },
        {
          type: "number_index",
          key: "index",
          label: "Index",
          clearable: true,
          min: 0,
        },
      ],
      validate: (command) => {
        return (
          command.output_cols.filter((e) => e !== "").length %
            command.columns.length ===
            0 &&
          (command.splits === "" || command.splits > command.index) &&
          command.separator != ""
        );
      },
    },
    payload: (columns, payload = {}) => {
      return {
        command: "unnest",
        columns,
        separator: ", ",
        splits: 2,
        index: "",
        drop: false,
        output_cols: columns.map((e) => e),
        preview: {
          type: "unnest",
          expectedColumns: (c) => (c.splits ? c.splits : -1),
          highlightColor: "red",
          multipleOutputs: true,
        },
      };
    },
    content: (payload) =>
      `<b>Split</b> ${hlCols(payload.columns[0])} by ${hlParam(
        payload.separator
      )} in ${hlParam(payload.splits)}`,
  },

  nest: {
    dialog: {
      fields: [
        {
          type: "field",
          key: "separator",
          label: "Separator",
        },
        {
          type: "field",
          key: "output_col",
          label: "Output column name",
          placeholder: (c) => c.columns.join("_"),
          clearable: true,
        },
      ],
    },
    payload: (columns, payload = {}) => {
      return {
        command: "nest",
        columns,
        separator: ", ",
        title: "Nest " + (columns.length == 1 ? `column` : "columns"),
        defaultOutputName: columns.join("_"),
        output_col: columns.join("_"),
        preview: {
          type: "nest",
          expectedColumns: 1,
          highlightColor: "green",
        },
      };
    },
    content: (payload) =>
      `<b>Merge</b> ${multipleContent(
        [payload.columns],
        "hl--cols"
      )} in ${hlCols(payload.output_col)}`,
  },

  duplicate: {
    dialog: {
      output_cols: true,
      validate: (command) => {
        return (
          command.output_cols.filter((e) => e !== "").length ==
          command.columns.length
        );
      },
    },
    payload: (columns, payload = {}) => {
      return {
        command: "duplicate",
        columns,
        title: "Duplicate " + (columns.length == 1 ? `column` : "columns"),
        output_cols: columns.map((e) => newName(e)),
        preview: {
          fake: "duplicate",
        },
      };
    },
    content: (payload) =>
      `<b>Duplicate</b> ${multipleContent(
        [payload.columns, payload.output_cols],
        "hl--cols"
      )}`,
  },

  bucketizer: {
    dialog: {
      title: "Create Bins",
      output_cols: true,
      fields: [
        {
          type: "number",
          key: "splits",
          label: "Splits",
          min: 0,
        },
      ],
      validate: (command) => {
        return (
          command.output_cols.filter((e) => e !== "").length %
            command.columns.length ==
            0 && command.splits > 0
        );
      },
    },
    payload: (columns, payload = {}) => {
      return {
        command: "bucketizer",
        columns: columns,
        splits: 2,
        output_cols: columns.map((e) => ""),
      };
    },
    content: (payload) => {
      // TO-DO: Test
      return (
        `<b>Bucketize</b> ` +
        columnsHint(payload.columns, payload.output_cols) +
        (payload.splits ? `by ${hlParam(payload.splits)}` : "")
      );
    },
  },

  values_to_cols: {
    payload: (columns, payload = {}) => {
      return {
        command: "values_to_cols",
        columns: columns,
      };
    },
    content: (payload) => {
      // TO-DO: Test
      return `<b>Set values to columns</b> using ${hlCols(payload.columns[0])}`;
    },
  },

  string_to_index: {
    dialog: {
      title: "Strings to Index",
      output_cols: true,
      validate: (command) => {
        if (
          command.output_cols.filter((e) => e !== "").length %
            command.columns.length ==
          0
        )
          return true;
        return false;
      },
    },
    payload: (columns, payload = {}) => {
      return {
        command: "string_to_index",
        columns: columns,
        output_cols: columns.map((e) => ""),
      };
    },
    content: (payload) => {
      // TO-DO: Test
      return (
        `<b>Set strings to indices</b> on` +
        columnsHint(payload.columns, payload.output_cols)
      );
    },
  },

  index_to_string: {
    dialog: {
      title: "Indices to Strings",
      output_cols: true,
      validate: (command) => {
        if (
          command.output_cols.filter((e) => e !== "").length %
            command.columns.length ==
          0
        )
          return true;
        return false;
      },
    },
    payload: (columns, payload = {}) => {
      return {
        command: "index_to_string",
        columns: columns,
        output_cols: columns.map((e) => ""),
      };
    },
    content: (payload) => {
      // TO-DO: Test
      return (
        `<b>Set indices to strings</b> ` +
        columnsHint(payload.columns, payload.output_cols)
      );
    },
  },

  ML: {
    // TO-DO: Test
    dialog: {
      title: (command) => {
        if (command.command == "z_score") return "Standard scaler";
        if (command.command == "min_max_scaler") return "Min max scaler";
        if (command.command == "max_abs_scaler") return "Max abs scaler";
      },
      text: (command) => {
        return `Apply to ${arrayJoin(command.columns)}`;
      },
      output_cols: true,
      validate: (command) => {
        if (
          command.output_cols.filter((e) => e !== "").length %
            command.columns.length ==
          0
        )
          return true;
        return false;
      },
    },
    payload: (columns, payload = {}) => {
      return {
        columns: columns,
        output_cols: columns.map((e) => ""),
      };
    },
    content: (payload) => {
      // TO-DO: Test
      var scaler = "scaler";
      if (command.command == "z_score") scaler = "standard scaler";
      if (command.command == "min_max_scaler") scaler = "min max scaler";
      if (command.command == "max_abs_scaler") scaler = "max abs scaler";
      return (
        `<b>Apply ${scaler}</b> to` +
        columnsHint(payload.columns, payload.output_cols) +
        (payload.splits ? `by ${hlParam(payload.splits)}` : "")
      );
    },
  },

  impute: {
    dialog: {
      title: "Impute rows",
      output_cols: true,
      fields: [
        {
          type: "select",
          key: "data_type",
          label: "Data type",
          placeholder: "Data type",
          items: [
            { text: "Continuous", value: "continuous" },
            { text: "Categorical", value: "categorical" },
          ],
        },
        {
          type: "select",
          key: "strategy",
          label: "Strategy",
          placeholder: "Strategy",
          items: [
            { text: "Mean", value: "mean" },
            { text: "Median", value: "median" },
          ],
        },
      ],
      validate: (command) => {
        if (
          command.output_cols.filter((e) => e !== "").length %
            command.columns.length ==
          0
        )
          return true;
        return false;
      },
    },
    payload: (columns, payload = {}) => {
      return {
        command: "impute",
        data_type: "continuous",
        strategy: "mean",
        columns: columns,
        output_cols: columns.map((e) => ""),
      };
    },
    content: (payload) => {
      // TO-DO: Test
      return (
        `<b>Impute rows</b> on` +
        columnsHint(payload.columns, payload.output_cols) +
        (payload.strategy ? `using ${hlParam(payload.strategy)}` : "")
      );
    },
  },

  sample_n: {
    dialog: {
      title: "Sampling",
      fields: [
        {
          type: "number",
          key: "n",
          label: "Number of samples",
          placeholder: "Number of samples",
        },
      ],
      validate: (command) => {
        if (command.n) return true;
        return false;
      },
    },
    payload: (columns, payload = {}) => {
      return {
        command: "sample_n",
        n: 10,
        columns: columns,
      };
    },
    content: (payload) => {
      // TO-DO: Test
      return `<b>Sample</b> to ${hlParam(payload.n)} rows`;
    },
  },
};

export default { commandsHandlers }
