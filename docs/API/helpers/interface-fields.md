# Fields

## Properties for all fields

The following property can be defined for all field types:

- `type` (String, required)
- `name` (String, required)
- `label` (String) a bold label displayed before the input field
- `description` (String) a description displayed before the input field
- `default` (Mixed) a default value for the field
- `warning` (String) a warning label to be displayed to the user below the input
- [ready](https://developers.fliplet.com/API/helpers/interface-hooks.html#run-a-function-when-a-field-is-initialized) (Function) a function to run when a field is initialized
- [change](https://developers.fliplet.com/API/helpers/interface-hooks.html#run-a-function-when-a-field-value-changes) (Function) a function to run when a field value changes

## Types

### Text input

A simple text input field. Also supports the following optional properties:

- `placeholder` (String)
- `required` (Boolean)

Example:

```js
{
  type: 'text',
  name: 'firstName',
  label: 'First Name',
  description: 'The first name of the user',
  placeholder: 'Type your name',
  default: 'John',
  required: true
}
```

---

### Textarea

A simple textarea input field. Also supports the following optional properties:

- `required` (Boolean)
- `rows` (Number)

Example:

```js
{
  type: 'textarea',
  name: 'bio',
  label: 'Bio',
  description: 'Type your bio',
  required: true,
  rows: 5
}
```

---

### Checkbox

A list of checkboxes for the user to allow a multiple choice selection. Supports the following property:

- `options` (**Array** of strings or objects with either `{ value: string}` or `{ value: string, label: string }`)

Example:

```js
{
  type: 'checkbox',
  name: 'fruits',
  label: 'Choose one or more fruits',
  options: ['Apple', 'Orange']
}
```

Example with different label and value:

```js
{
  type: 'checkbox',
  name: 'fruits',
  label: 'What stocks do you like?',
  options: [
    { value: 'AAPL', label: 'Apple' },
    { value: 'GOOGL', label: 'Google' }
  ]
}
```

---

### Radio

A list of radio buttons for the user to allow a single choice selection. Supports the following property:

- `options` (**Array** of strings or objects with either `{ value: string}` or `{ value: string, label: string }`)

Example:

```js
{
  type: 'radio',
  name: 'fruits',
  label: 'Choose a fruit',
  options: ['Apple', 'Orange']
}
```

Example with different label and value:

```js
{
  type: 'radio',
  name: 'fruits',
  label: 'Which stock do you like most?',
  options: [
    { value: 'AAPL', label: 'Apple' },
    { value: 'GOOGL', label: 'Google' }
  ]
}
```

---

### Provider

A provider (Fliplet first-party component) to perform a variety of tasks. These are commonly used to reuse existing functionality, e.g. let the user choose a screen or a data source.

- `package` (**string**, e.g. `com.fliplet.link`)
- `mode` (**string**, either not provided or with value `full-screen`)
- `html` (**string**, when using `full-screen` this is the `Handlebars` template to define a placeholder to launch the provider)

These are the supported inline provider packages:

- `com.fliplet.link`: choose an App Screen or URL for a navigate action
- `com.fliplet.data-source-provider`: choose a Data Source

Example for an inline provider:

```js
{
  type: 'provider',
  name: 'action',
  label: 'Choose an action to do when the button is pressed',
  package: 'com.fliplet.link'
}
```

On the other hand, these are the supported `full-screen` provider packages:

- `com.fliplet.file-picker`: choose one or multiple files and folders
- `com.fliplet.email`: configure an email to be sent

Example for a `full-screen` provider:

```js
{
  type: 'provider',
  name: 'files',
  label: 'Choose a file',
  package: 'com.fliplet.file-picker',
  mode: 'full-screen',
  html: '<button data-open-provider>Configure</button> You selected {{ value.length }} files'
}
```

As shown in the example above, the `html` requires a trigger element to open the provider. You can define the trigger by adding the `data-open-provider` data attribute to any HTML element defined in the Handlebars template.

---

### HTML

A freeform HTML field. Supports the following properties:

- `html` (HTML String) the HTML template
- [ready](https://developers.fliplet.com/API/helpers/interface-hooks.html#run-a-function-when-a-field-is-initialized) (Function) a function to run when a field is initialized

```js
{
  type: 'html',
  html: '<input type="email" name="Email" />'
}
```

---

### List of fields

An array of fields for the user to allow setting up complex lists. Each item in the list is displayed as an accordion with the list of fields configured in your list. Here's an example of what it looks like:

![List of fields](../../assets/img/helper-field-list.png)

A list of fields supports the following property:

- `addLabel` (`String`) the label displayed in the UI to add a new item
- `headingFieldName` (`String`) the name of the field that should display its value in the accordion header
- `emptyListPlaceholderHtml` (`HTML String`) optional HTML to display when the list is empty
- `fields` (**Array** of field objects) the array of fields to display for the user to configure for each item in the list

Example:

```js
{
  name: 'buttons',
  label: 'Buttons',
  type: 'list',
  addLabel: 'Add button',
  headingFieldName: 'title',
  emptyListPlaceholderHtml: '<p>Please add at least one button</p>',
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Button title',
      placeholder: 'Sample button'
    },
    {
      type: 'provider',
      name: 'action',
      label: 'Choose what happens when the button is pressed',
      package: 'com.fliplet.link'
    }
  ]
}
```



---

## Further reading

<section class="blocks alt">
  <a class="bl two" href="interface-hooks.html">
    <div>
      <span class="pin">Recommended reading</span>
      <h4>Hooks &amp; Events</h4>
      <p>Learn the different hooks and events for helper interfaces.</p>
      <button>Read &rarr;</button>
    </div>
  </a>
</section>