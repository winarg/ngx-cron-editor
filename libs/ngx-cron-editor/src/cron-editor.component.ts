import { Component, Input, Output, OnInit, OnChanges, SimpleChanges, EventEmitter, forwardRef } from '@angular/core';
import { CronOptions } from './CronOptions';
import { Days, MonthWeeks, Months } from './enums';
import { ControlContainer, ControlValueAccessor, FormBuilder, FormControl, FormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ThemePalette } from '@angular/material/core';


export const CRON_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  // eslint:disable-next-line:no-use-before-declare
  useExisting: forwardRef(() => CronGenComponent),
  multi: true,
};


@Component({
  selector: 'cron-editor',
  templateUrl: './cron-editor.template.html',
  styleUrls: ['./cron-editor.component.css'],
  providers: [CRON_VALUE_ACCESSOR]
})
export class CronGenComponent implements OnInit, ControlValueAccessor {

  @Input() public backgroundColor: ThemePalette;
  @Input() public color: ThemePalette;
  @Input() public disabled: boolean;
  @Input() public options: CronOptions;

  // @Input() get cron(): string {
  //   return this.localCron;
  // }

  // set cron(value: string) {
  //   this.localCron = value;
  //   this.onChange(value);
  // }

  @Input() cron: string;

  @Output() cronChange = new EventEmitter();

  public activeTab: string;
  public selectOptions = this.getSelectOptions();
  public state: any;

  public selectedIndex: number;

  private localCron = '0 0 1/1 * *';
  private isDirty: boolean;

  private tabs: string[] = [];

  cronForm: FormControl;

  minutesForm: FormGroup;
  hourlyForm: FormGroup;
  dailyForm: FormGroup;
  weeklyForm: FormGroup;
  monthlyForm: FormGroup;
  yearlyForm: FormGroup;
  advancedForm: FormGroup;


  get isCronFlavorQuartz() {
    return this.options.cronFlavor === 'quartz';
  }

  get isCronFlavorStandard() {
    return this.options.cronFlavor === 'standard';
  }

  get yearDefaultChar() {
    return this.options.cronFlavor === 'quartz' ? '*' : '';
  }

  get weekDayDefaultChar() {
    return this.options.cronFlavor === 'quartz' ? '?' : '*';
  }

  get monthDayDefaultChar() {
    return this.options.cronFlavor === 'quartz' ? '?' : '*';
  }


  constructor(private fb: FormBuilder) {
  }

  /* Update the cron output to that of the selected tab.
   * The cron output value is updated whenever a form is updated. To make it change in response to tab selection, we simply reset
   * the value of the form that goes into focus. */
  public onTabFocus(idx: number) {

    const index = this.tabs[idx];

    switch (index) {
      case 'minutes':
        this.minutesForm.setValue(this.minutesForm.value);
        break;
      case 'hourly':
        this.hourlyForm.setValue(this.hourlyForm.value);
        break;
      case 'daily':
        this.dailyForm.setValue(this.dailyForm.value);
        break;
      case 'weekly':
        this.weeklyForm.setValue(this.weeklyForm.value);
        break;
      case 'monthly':
        this.monthlyForm.setValue(this.monthlyForm.value);
        break;
      case 'yearly':
        this.yearlyForm.setValue(this.yearlyForm.value);
        break;
      case 'advanced':
        this.advancedForm.setValue(this.advancedForm.value);
        break;
      default:
        throw (new Error('Invalid tab selected'));
    }
  }

  public ngOnInit() {
    this.buildTabIndex();

    this.state = this.getDefaultState();

    this.handleModelChange(this.cron);

    const [defaultHours, defaultMinutes, defaultSeconds] = this.options.defaultTime.split(':').map(Number);

    this.cronForm = new FormControl(this.cron);

    this.minutesForm = this.fb.group({
      hours: [0],
      minutes: [1],
      seconds: [0]
    });

    this.minutesForm.valueChanges.subscribe(value => this.computeMinutesCron(value));

    this.hourlyForm = this.fb.group({
      hours: [1],
      minutes: [0],
      seconds: [0]
    });
    this.hourlyForm.valueChanges.subscribe(value => this.computeHourlyCron(value));

    this.dailyForm = this.fb.group({
      subTab: ['everyDays'],
      everyDays: this.fb.group({
        days: [1],
        hours: [this.getAmPmHour(1)],
        minutes: [0],
        seconds: [0],
        hourType: [this.getHourType(0)]
      }),
      everyWeekDay: this.fb.group({
        days: [0],
        hours: [this.getAmPmHour(1)],
        minutes: [0],
        seconds: [0],
        hourType: [this.getHourType(0)]
      })
    });
    this.dailyForm.valueChanges.subscribe(value => this.computeDailyCron(value));

    this.weeklyForm = this.fb.group({
      MON: [true],
      TUE: [false],
      WED: [false],
      THU: [false],
      FRI: [false],
      SAT: [false],
      SUN: [false],
      hours: [this.getAmPmHour(defaultHours)],
      minutes: [defaultMinutes],
      seconds: [defaultSeconds],
      hourType: [this.getHourType(defaultHours)]
    });
    this.weeklyForm.valueChanges.subscribe(next => this.computeWeeklyCron(next));

    this.monthlyForm = this.fb.group({
      subTab: ['specificDay'],
      specificDay: this.fb.group({
        day: ['1'],
        months: [1],
        hours: [this.getAmPmHour(defaultHours)],
        minutes: [defaultMinutes],
        seconds: [defaultSeconds],
        hourType: [this.getHourType(defaultHours)]
      }),
      specificWeekDay: this.fb.group({
        monthWeek: ['#1'],
        day: ['MON'],
        months: [1],
        hours: [this.getAmPmHour(defaultHours)],
        minutes: [defaultMinutes],
        seconds: [defaultSeconds],
        hourType: [this.getHourType(defaultHours)]
      })
    });
    this.monthlyForm.valueChanges.subscribe(next => this.computeMonthlyCron(next));

    this.yearlyForm = this.fb.group({
      subTab: ['specificMonthDay'],
      specificMonthDay: this.fb.group({
        month: [1],
        day: ['1'],
        hours: [this.getAmPmHour(defaultHours)],
        minutes: [defaultMinutes],
        seconds: [defaultSeconds],
        hourType: [this.getHourType(defaultHours)]
      }),
      specificMonthWeek: this.fb.group({
        monthWeek: ['#1'],
        day: ['MON'],
        month: [1],
        hours: [this.getAmPmHour(defaultHours)],
        minutes: [defaultMinutes],
        seconds: [defaultSeconds],
        hourType: [this.getHourType(defaultHours)]
      })
    });
    this.yearlyForm.valueChanges.subscribe(next => this.computeYearlyCron(next));

    this.advancedForm = this.fb.group({
      expression: [this.isCronFlavorQuartz ? '0 15 10 L-2 * ? *' : '15 10 2 * *']
    });
    this.advancedForm.controls.expression.valueChanges.subscribe(next => this.computeAdvancedExpression(next));
  }

  private computeMinutesCron(state: any) {
    this.cron = `${this.isCronFlavorQuartz ? state.seconds : ''} 0/${state.minutes} * 1/1 * ${this.weekDayDefaultChar} ${this.yearDefaultChar}`.trim();
    this.cronForm.setValue(this.cron);
    this.onChange(this.cron);
  }

  private computeHourlyCron(state: any) {
    this.cron = `${this.isCronFlavorQuartz ? state.seconds : ''} ${state.minutes} 0/${state.hours} 1/1 * ${this.weekDayDefaultChar} ${this.yearDefaultChar}`.trim();
    this.cronForm.setValue(this.cron);
    this.onChange(this.cron);
  }

  private computeDailyCron(state: any) {
    switch (state.subTab) {
      case 'everyDays':
        this.cron = `${this.isCronFlavorQuartz ? state.everyDays.seconds : ''} ${state.everyDays.minutes} ${this.hourToCron(state.everyDays.hours, state.everyDays.hourType)} 1/${state.everyDays.days} * ${this.weekDayDefaultChar} ${this.yearDefaultChar}`.trim();
        break;
      case 'everyWeekDay':
        this.cron = `${this.isCronFlavorQuartz ? state.everyWeekDay.seconds : ''} ${state.everyWeekDay.minutes} ${this.hourToCron(state.everyWeekDay.hours, state.everyWeekDay.hourType)} ${this.monthDayDefaultChar} * MON-FRI ${this.yearDefaultChar}`.trim();
        break;
      default:
        throw new Error('Invalid cron daily subtab selection');
    }
    this.cronForm.setValue(this.cron);
    this.onChange(this.cron);
  }

  private computeWeeklyCron(state: any) {
    const days = this.selectOptions.days
      .reduce((acc, day) => state[day] ? acc.concat([day]) : acc, [])
      .join(',');
    this.cron = `${this.isCronFlavorQuartz ? state.seconds : ''} ${state.minutes} ${this.hourToCron(state.hours, state.hourType)} ${this.monthDayDefaultChar} * ${days} ${this.yearDefaultChar}`.trim();
    this.cronForm.setValue(this.cron);
    this.onChange(this.cron);
  }

  private computeMonthlyCron(state: any) {
    switch (state.subTab) {
      case 'specificDay':
        this.cron = `${this.isCronFlavorQuartz ? state.specificDay.seconds : ''} ${state.specificDay.minutes} ${this.hourToCron(state.specificDay.hours, state.specificDay.hourType)} ${state.specificDay.day} 1/${state.specificDay.months} ${this.weekDayDefaultChar} ${this.yearDefaultChar}`.trim();
        break;
      case 'specificWeekDay':
        this.cron = `${this.isCronFlavorQuartz ? state.specificWeekDay.seconds : ''} ${state.specificWeekDay.minutes} ${this.hourToCron(state.specificWeekDay.hours, state.specificWeekDay.hourType)} ${this.monthDayDefaultChar} 1/${state.specificWeekDay.months} ${state.specificWeekDay.day}${state.specificWeekDay.monthWeek} ${this.yearDefaultChar}`.trim();
        break;
      default:
        throw new Error('Invalid cron montly subtab selection');
    }
    this.cronForm.setValue(this.cron);
    this.onChange(this.cron);
  }

  private computeYearlyCron(state: any) {
    switch (state.subTab) {
      case 'specificMonthDay':
        this.cron = `${this.isCronFlavorQuartz ? state.specificMonthDay.seconds : ''} ${state.specificMonthDay.minutes} ${this.hourToCron(state.specificMonthDay.hours, state.specificMonthDay.hourType)} ${state.specificMonthDay.day} ${state.specificMonthDay.month} ${this.weekDayDefaultChar} ${this.yearDefaultChar}`.trim();
        break;
      case 'specificMonthWeek':
        this.cron = `${this.isCronFlavorQuartz ? state.specificMonthWeek.seconds : ''} ${state.specificMonthWeek.minutes} ${this.hourToCron(state.specificMonthWeek.hours, state.specificMonthWeek.hourType)} ${this.monthDayDefaultChar} ${state.specificMonthWeek.month} ${state.specificMonthWeek.day}${state.specificMonthWeek.monthWeek} ${this.yearDefaultChar}`.trim();
        break;
      default:
        throw new Error('Invalid cron yearly subtab selection');
    }
    this.cronForm.setValue(this.cron);
    this.onChange(this.cron);
  }

  private computeAdvancedExpression(expression: any) {
    this.cron = expression;
    this.cronForm.setValue(this.cron);
    this.onChange(this.cron);
  }

  public dayDisplay(day: string): string {
    return Days[day];
  }

  public monthWeekDisplay(monthWeekNumber: string): string {
    return MonthWeeks[monthWeekNumber];
  }

  public monthDisplay(month: number): string {
    return Months[month];
  }

  public monthDayDisplay(month: string): string {
    if (month === 'L') {
      return 'Last Day';
    } else if (month === 'LW') {
      return 'Last Weekday';
    } else if (month === '1W') {
      return 'First Weekday';
    } else {
      return `${month}${this.getOrdinalSuffix(month)}`;
    }
  }

  private getAmPmHour(hour: number) {
    return this.options.use24HourTime ? hour : (hour + 11) % 12 + 1;
  }

  private getHourType(hour: number) {
    return this.options.use24HourTime ? undefined : (hour >= 12 ? 'PM' : 'AM');
  }

  private hourToCron(hour: number, hourType: string) {
    if (this.options.use24HourTime) {
      return hour;
    } else {
      return hourType === 'AM' ? (hour === 12 ? 0 : hour) : (hour === 12 ? 12 : hour + 12);
    }
  }

  public handleModelChange(cron: string) {
    this.cron = cron;

    if (!this.cronIsValid(cron)) {
      // if (this.isCronFlavorQuartz) {
      //   throw new Error('Invalid cron expression, there must be 6 or 7 segments');
      // }

      // if (this.isCronFlavorStandard) {
      //   throw new Error('Invalid cron expression, there must be 5 segments');
      // }
      return;
    }

    const origCron: string = cron;
    if (cron.split(' ').length === 5 && this.isCronFlavorStandard) {
      cron = `0 ${cron} *`;
    }

    const [seconds, minutes, hours, dayOfMonth, month, dayOfWeek] = cron.split(' ');

    if (cron.match(/\d+ 0\/\d+ \* 1\/1 \* [\?\*] \*/)) {
      this.activeTab = 'minutes';
      this.selectedIndex = 0;

      this.state.minutes.minutes = parseInt(minutes.substring(2), 10);
      this.state.minutes.seconds = parseInt(seconds, 10);

      this.minutesForm.patchValue({
        hours: 0,
        minutes: this.state.minutes.minutes,
        seconds: this.state.minutes.seconds
      });

    } else if (cron.match(/\d+ \d+ 0\/\d+ 1\/1 \* [\?\*] \*/)) {
      this.activeTab = 'hourly';
      this.selectedIndex = this.calculateActiveTab('hourly'); // 1;

      this.state.hourly.hours = parseInt(hours.substring(2), 10);
      this.state.hourly.minutes = parseInt(minutes, 10);
      this.state.hourly.seconds = parseInt(seconds, 10);

      this.hourlyForm.patchValue({
        hours: this.state.hourly.hours,
        minutes: this.state.hourly.minutes,
        seconds: this.state.hourly.seconds
      });

    } else if (cron.match(/\d+ \d+ \d+ 1\/\d+ \* [\?\*] \*/)) {
      this.activeTab = 'daily';
      this.selectedIndex = this.calculateActiveTab('daily'); // 2;

      this.state.daily.subTab = 'everyDays';
      this.state.daily.everyDays.days = parseInt(dayOfMonth.substring(2), 10);
      const parsedHours = parseInt(hours, 10);
      this.state.daily.everyDays.hours = this.getAmPmHour(parsedHours);
      this.state.daily.everyDays.hourType = this.getHourType(parsedHours);
      this.state.daily.everyDays.minutes = parseInt(minutes, 10);
      this.state.daily.everyDays.seconds = parseInt(seconds, 10);

      this.dailyForm.patchValue({
        subTab: this.state.daily.subTab,
        everyDays: {
          days: this.state.daily.everyDays.days,
          hours: this.state.daily.everyDays.hours,
          minutes: this.state.daily.everyDays.minutes,
          seconds: this.state.daily.everyDays.seconds,
          hourType: this.state.daily.everyDays.hourType
        }
      });

    } else if (cron.match(/\d+ \d+ \d+ [\?\*] \* MON-FRI \*/)) {
      this.activeTab = 'daily';
      this.selectedIndex = this.calculateActiveTab('daily'); // 2;

      this.state.daily.subTab = 'everyWeekDay';
      const parsedHours = parseInt(hours, 10);
      this.state.daily.everyWeekDay.hours = this.getAmPmHour(parsedHours);
      this.state.daily.everyWeekDay.hourType = this.getHourType(parsedHours);
      this.state.daily.everyWeekDay.minutes = parseInt(minutes, 10);
      this.state.daily.everyWeekDay.seconds = parseInt(seconds, 10);

      this.dailyForm.patchValue({
        subTab: this.state.daily.subTab,
        everyWeekDay: {
          // days: [0],
          hours: this.state.daily.everyWeekDay.hours,
          minutes: this.state.daily.everyWeekDay.minutes,
          seconds: this.state.daily.everyWeekDay.seconds,
          hourType: this.state.daily.everyWeekDay.hourType
        }
      });

    } else if (cron.match(/\d+ \d+ \d+ [\?\*] \* (MON|TUE|WED|THU|FRI|SAT|SUN)(,(MON|TUE|WED|THU|FRI|SAT|SUN))* \*/)) {
      this.activeTab = 'weekly';
      this.selectedIndex = this.calculateActiveTab('weekly'); // 3;

      this.selectOptions.days.forEach(weekDay => this.state.weekly[weekDay] = false);
      dayOfWeek.split(',').forEach(weekDay => this.state.weekly[weekDay] = true);
      const parsedHours = parseInt(hours, 10);
      this.state.weekly.hours = this.getAmPmHour(parsedHours);
      this.state.weekly.hourType = this.getHourType(parsedHours);
      this.state.weekly.minutes = parseInt(minutes, 10);
      this.state.weekly.seconds = parseInt(seconds, 10);

      this.weeklyForm.patchValue({
        MON: this.state.weekly['MON'],
        TUE: this.state.weekly['TUE'],
        WED: this.state.weekly['WED'],
        THU: this.state.weekly['THU'],
        FRI: this.state.weekly['FRI'],
        SAT: this.state.weekly['SAT'],
        SUN: this.state.weekly['SUN'],
        hours: this.state.weekly.hours,
        minutes: this.state.weekly.minutes,
        seconds: this.state.weekly.seconds,
        // hourType: this.state.weekly.hourType
      });

    } else if (cron.match(/\d+ \d+ \d+ (\d+|L|LW|1W) 1\/\d+ [\?\*] \*/)) {
      this.activeTab = 'monthly';
      this.selectedIndex = this.calculateActiveTab('monthly'); // 4;

      this.state.monthly.subTab = 'specificDay';
      this.state.monthly.specificDay.day = dayOfMonth;
      this.state.monthly.specificDay.months = parseInt(month.substring(2), 10);
      const parsedHours = parseInt(hours, 10);
      this.state.monthly.specificDay.hours = this.getAmPmHour(parsedHours);
      this.state.monthly.specificDay.hourType = this.getHourType(parsedHours);
      this.state.monthly.specificDay.minutes = parseInt(minutes, 10);
      this.state.monthly.specificDay.seconds = parseInt(seconds, 10);

      this.monthlyForm.patchValue({
        subTab: 'specificDay',
        specificDay: {
          day: dayOfMonth,
          months: this.state.monthly.specificDay.months,
          hours: this.state.monthly.specificDay.hours,
          minutes: this.state.monthly.specificDay.minutes,
          seconds: this.state.monthly.specificDay.seconds,
          hourType: this.state.monthly.specificDay.hourType
        }
      });

    } else if (cron.match(/\d+ \d+ \d+ [\?\*] 1\/\d+ (MON|TUE|WED|THU|FRI|SAT|SUN)((#[1-5])|L) \*/)) {
      const day = dayOfWeek.substr(0, 3);
      const monthWeek = dayOfWeek.substr(3);
      this.activeTab = 'monthly';
      this.selectedIndex = this.calculateActiveTab('monthly'); // 4;

      this.state.monthly.subTab = 'specificWeekDay';
      this.state.monthly.specificWeekDay.monthWeek = monthWeek;
      this.state.monthly.specificWeekDay.day = day;
      this.state.monthly.specificWeekDay.months = parseInt(month.substring(2), 10);
      const parsedHours = parseInt(hours, 10);
      this.state.monthly.specificWeekDay.hours = this.getAmPmHour(parsedHours);
      this.state.monthly.specificWeekDay.hourType = this.getHourType(parsedHours);
      this.state.monthly.specificWeekDay.minutes = parseInt(minutes, 10);
      this.state.monthly.specificWeekDay.seconds = parseInt(seconds, 10);

      this.monthlyForm.patchValue({
        subTab: 'specificWeekDay',
        specificWeekDay: {
          monthWeek: monthWeek,
          day: day,
          months: this.state.monthly.specificWeekDay.months,
          hours: this.state.monthly.specificWeekDay.hours,
          minutes: this.state.monthly.specificWeekDay.minutes,
          seconds: this.state.monthly.specificWeekDay.seconds,
          hourType: this.state.monthly.specificWeekDay.hourType
        }
      });

    } else if (cron.match(/\d+ \d+ \d+ (\d+|L|LW|1W) \d+ [\?\*] \*/)) {
      this.activeTab = 'yearly';
      this.selectedIndex = this.calculateActiveTab('yearly'); // 5;

      this.state.yearly.subTab = 'specificMonthDay';
      this.state.yearly.specificMonthDay.month = parseInt(month, 10);
      this.state.yearly.specificMonthDay.day = dayOfMonth;
      const parsedHours = parseInt(hours, 10);
      this.state.yearly.specificMonthDay.hours = this.getAmPmHour(parsedHours);
      this.state.yearly.specificMonthDay.hourType = this.getHourType(parsedHours);
      this.state.yearly.specificMonthDay.minutes = parseInt(minutes, 10);
      this.state.yearly.specificMonthDay.seconds = parseInt(seconds, 10);

      this.yearlyForm.patchValue({
        subTab: ['specificMonthDay'],
        specificMonthDay: {
          month: this.state.yearly.specificMonthDay.month,
          day: this.state.yearly.specificMonthDay.day,
          hours: this.state.yearly.specificMonthDay.hours,
          minutes: this.state.yearly.specificMonthDay.minutes,
          seconds: this.state.yearly.specificMonthDay.seconds,
          hourType: this.state.yearly.specificMonthDay.hourType
        }
      });

    } else if (cron.match(/\d+ \d+ \d+ [\?\*] \d+ (MON|TUE|WED|THU|FRI|SAT|SUN)((#[1-5])|L) \*/)) {
      const day = dayOfWeek.substr(0, 3);
      const monthWeek = dayOfWeek.substr(3);
      this.activeTab = 'yearly';
      this.selectedIndex = this.calculateActiveTab('yearly');

      this.state.yearly.subTab = 'specificMonthWeek';
      this.state.yearly.specificMonthWeek.monthWeek = monthWeek;
      this.state.yearly.specificMonthWeek.day = day;
      this.state.yearly.specificMonthWeek.month = parseInt(month, 10);
      const parsedHours = parseInt(hours, 10);
      this.state.yearly.specificMonthWeek.hours = this.getAmPmHour(parsedHours);
      this.state.yearly.specificMonthWeek.hourType = this.getHourType(parsedHours);
      this.state.yearly.specificMonthWeek.minutes = parseInt(minutes, 10);
      this.state.yearly.specificMonthWeek.seconds = parseInt(seconds, 10);

      this.yearlyForm.patchValue({
        specificMonthWeek: {
          monthWeek: ['#1'],
          day: ['MON'],
          month: [1],
          hours: this.state.yearly.specificMonthWeek.hours,
          minutes: this.state.yearly.specificMonthWeek.minutes,
          seconds: this.state.yearly.specificMonthWeek.seconds,
          hourType: this.state.yearly.specificMonthWeek.hourType
        }
      });

    } else {
      this.activeTab = 'advanced';
      this.selectedIndex = this.calculateActiveTab('advanced'); // 6;

      this.state.advanced.expression = origCron;

      this.advancedForm.patchValue({
        expression: [origCron]
      });
    }

    // this._cd.markForCheck();
  }

  private cronIsValid(cron: string): boolean {
    if (cron) {
      const cronParts = cron.split(' ');
      return (this.isCronFlavorQuartz && (cronParts.length === 6
        || cronParts.length === 7)
        || (this.isCronFlavorStandard && cronParts.length === 5));
    }

    return false;
  }


  private getDefaultState() {
    const [defaultHours, defaultMinutes, defaultSeconds] = this.options.defaultTime.split(':').map(Number);

    return {
      minutes: {
        minutes: 1,
        seconds: 0
      },
      hourly: {
        hours: 1,
        minutes: 0,
        seconds: 0
      },
      daily: {
        subTab: 'everyDays',
        everyDays: {
          days: 1,
          hours: this.getAmPmHour(defaultHours),
          minutes: defaultMinutes,
          seconds: defaultSeconds,
          hourType: this.getHourType(defaultHours)
        },
        everyWeekDay: {
          hours: this.getAmPmHour(defaultHours),
          minutes: defaultMinutes,
          seconds: defaultSeconds,
          hourType: this.getHourType(defaultHours)
        }
      },
      weekly: {
        MON: true,
        TUE: false,
        WED: false,
        THU: false,
        FRI: false,
        SAT: false,
        SUN: false,
        hours: this.getAmPmHour(defaultHours),
        minutes: defaultMinutes,
        seconds: defaultSeconds,
        hourType: this.getHourType(defaultHours)
      },
      monthly: {
        subTab: 'specificDay',
        specificDay: {
          day: '1',
          months: 1,
          hours: this.getAmPmHour(defaultHours),
          minutes: defaultMinutes,
          seconds: defaultSeconds,
          hourType: this.getHourType(defaultHours)
        },
        specificWeekDay: {
          monthWeek: '#1',
          day: 'MON',
          months: 1,
          hours: this.getAmPmHour(defaultHours),
          minutes: defaultMinutes,
          seconds: defaultSeconds,
          hourType: this.getHourType(defaultHours)
        }
      },
      yearly: {
        subTab: 'specificMonthDay',
        specificMonthDay: {
          month: 1,
          day: '1',
          hours: this.getAmPmHour(defaultHours),
          minutes: defaultMinutes,
          seconds: defaultSeconds,
          hourType: this.getHourType(defaultHours)
        },
        specificMonthWeek: {
          monthWeek: '#1',
          day: 'MON',
          month: 1,
          hours: this.getAmPmHour(defaultHours),
          minutes: defaultMinutes,
          seconds: defaultSeconds,
          hourType: this.getHourType(defaultHours)
        }
      },
      advanced: {
        expression: this.isCronFlavorQuartz ? '0 15 10 L-2 * ? *' : '15 10 2 * *'
      }
    };
  }

  private getOrdinalSuffix(value: string) {
    if (value.length > 1) {
      const secondToLastDigit = value.charAt(value.length - 2);
      if (secondToLastDigit === '1') {
        return 'th';
      }
    }

    const lastDigit = value.charAt(value.length - 1);
    switch (lastDigit) {
      case '1':
        return 'st';
      case '2':
        return 'nd';
      case '3':
        return 'rd';
      default:
        return 'th';
    }
  }

  private getSelectOptions() {
    return {
      months: this.getRange(1, 12),
      monthWeeks: ['#1', '#2', '#3', '#4', '#5', 'L'],
      days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
      minutes: this.getRange(0, 59),
      fullMinutes: this.getRange(0, 59),
      seconds: this.getRange(0, 59),
      hours: this.getRange(1, 23),
      monthDays: this.getRange(1, 31),
      monthDaysWithLasts: ['1W', ...[...this.getRange(1, 31).map(String)], 'LW', 'L'],
      monthDaysWithOutLasts: [...[...this.getRange(1, 31).map(String)]],
      hourTypes: ['AM', 'PM']
    };
  }

  private getRange(start: number, end: number): number[] {
    const length = end - start + 1;
    return Array.apply(null, Array(length)).map((_, i) => i + start);
  }

  private calculateActiveTab(requestedTab: 'minutes' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'advanced'): number {

    const lastIndex = this.tabs.length - 1;

    switch (requestedTab) {
      case 'minutes':
        return this.options.hideMinutesTab ? lastIndex : this.tabs.indexOf('minutes');
      case 'hourly':
        return this.options.hideHourlyTab ? lastIndex : this.tabs.indexOf('hourly');
      case 'daily':
        return this.options.hideDailyTab ? lastIndex : this.tabs.indexOf('daily');
      case 'weekly':
        return this.options.hideWeeklyTab ? lastIndex : this.tabs.indexOf('weekly');
      case 'monthly':
        return this.options.hideMonthlyTab ? lastIndex : this.tabs.indexOf('monthly');
      case 'yearly':
        return this.options.hideYearlyTab ? lastIndex : this.tabs.indexOf('yearly');
      case 'advanced':
        return this.options.hideAdvancedTab ? lastIndex : this.tabs.indexOf('advanced');
    }
  }

  private buildTabIndex() {
    if (!this.options.hideMinutesTab) {
      this.tabs.push('minutes');
    }
    if (!this.options.hideHourlyTab) {
      this.tabs.push('hourly');
    }
    if (!this.options.hideDailyTab) {
      this.tabs.push('daily');
    }
    if (!this.options.hideWeeklyTab) {
      this.tabs.push('weekly');
    }
    if (!this.options.hideMonthlyTab) {
      this.tabs.push('monthly');
    }
    if (!this.options.hideYearlyTab) {
      this.tabs.push('yearly');
    }
    if (!this.options.hideAdvancedTab) {
      this.tabs.push('advanced');
    }
  }

  /*
   * ControlValueAccessor
   */
  public onChange = (_: any) => {
  };
  public onTouched = () => {
  };

  public writeValue(obj: string): void {
    this.handleModelChange(obj);
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

}
