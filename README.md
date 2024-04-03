ngx-cron-editor
===

An Angular 17 component for building cron expressions graphically. It is meant
to be used in reactive forms and support Angular Material Design styling.
 

## Demo

A work-in-progress demo can be found [here](https://stackblitz.com/edit/angular-ngx-cron-editor?file=src/app/app.component.html)

## Usage

1. Install the npm package:
    ```
    $ npm i @winarg/ngx-cron-editor -S
    ```

2. Import the module in your own module:

    ```ts
    import { CronEditorModule } from 'ngx-cron-editor';

    @NgModule({
        imports: [..., CronEditorModule],
    ...
    })
    export class MyModule {
    }
    ```

3. Setup the FormControl in you component's typescript file:
   
   ```ts
   ngOnInit(): void {
     this.cronForm = new FormControl('0 0 1/1 * *');
   }
   ```
   
4. Include the component in your html code:

    ```html
    <cron-editor [formControl]="cronForm"></cron-editor>
    ```
   
   or use the `formControlName='...'` directive if your form controller
   lives in a FormGroup.

## Options

```html
<cron-editor [formControl]="cronForm" [options]="cronOptions"></cron-editor>
```

```ts
import { CronOptions } from 'ngx-cron-editor';

@Component({
    ...
})
export class MyComponent {
   public cronOptions: CronOptions = {
       
       defaultTime: "00:00:00",

       hideMinutesTab: false,
       hideHourlyTab: false,
       hideDailyTab: false,
       hideWeeklyTab: false,
       hideMonthlyTab: false,
       hideYearlyTab: false,
       hideAdvancedTab: true,
       hideSpecificWeekDayTab : false,
       hideSpecificMonthWeekTab : false,

       use24HourTime: true,
       hideSeconds: false,

       cronFlavor: "quartz" //standard or quartz
    };
}
```

## History

The ngx-cron-editor is a fork of the vincentjames501's [angular-cron-gen](https://github.com/vincentjames501/angular-cron-gen) for AngularJS 1.5+ and claudiuconstantin's [cron-editor(https://github.com/claudiuconstantin/cron-editor)]. 

Then, a new fork was made in order to upgrade to Angular 13, remove jQuery and fix an issue when bidnig value to a reactive form.

**The main additions of this fork is support for Angular 13+ and material design.**


## License:
Licensed under the MIT license
