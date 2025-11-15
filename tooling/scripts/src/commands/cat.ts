import as, { type AnsiColors } from 'ansis'
import { Command } from 'commander'

export const cat = new Command('cat').description('Cat to test your terminal color output').action(() => {
  const p = (val: string, c: AnsiColors) => console.log(as[c](val))

  p('⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣀⣠⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣴⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣦⣤⣤⣤⣤⣤⣤⣄⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀', 'red')
  p('⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣾⡿⠟⠛⠛⠛⠛⠋⠉⠉⠉⠉⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠉⠉⠉⠛⣿⣦⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀', 'yellow')
  p('⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀', 'green')
  p('⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⠀⠀⣴⡄⠀⠀⠀⠀⣠⡄⠀⠀⠀⠀⠀⠀⠶⠀⠀⠀⠀⠀⠈⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⣿⠀⠀⠀⠀⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀', 'cyan')
  p('⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⠀⠀⠉⠁⠀⠀⠀⠘⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠁⠀⠀⠀⢸⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀', 'blue')
  p('⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣤⠀⢀⣶⣿⣷⣦⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⡇⠀⠀⠀⣀⣤⣄⠀⠀⠀', 'magenta')
  p('⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⠀⠀⠀⠀⠀⠀⣸⡇⠀⣸⡿⠀⠀⠉⠻⣿⣦⡀⠀⢰⡿⠀⠀⠀⠀⠀⣸⣿⣁⣴⣾⡿⠟⠛⣿⡄⠀⠀', 'redBright')
  p('⣴⣿⠿⠿⣿⣶⣦⣄⡀⠀⠀⠀⠀⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⠛⠀⠀⠀⠀⠀⠀⠉⠁⠀⣿⡇⠀⠀⠀⠀⠈⠻⣿⣆⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⠟⠁⠀⠀⠀⣿⡇⠀⠀', 'yellowBright')
  p('⢿⣧⠀⠀⠀⠀⠉⠛⢿⣶⣄⠀⠀⣿⣿⠀⠀⠀⠀⠀⠙⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⡀⠀⠀⠀⣿⠇⠀⠀⠀⠀⠀⠀⠈⢻⣷⣤⣤⣤⣤⣤⣼⣿⠟⠁⠀⠀⠀⠀⠀⣿⡇⠀⠀', 'greenBright')
  p('⠈⢿⣧⡀⠀⠀⠀⠀⠀⠈⢻⣷⡄⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠛⠃⠀⠀⢰⣿⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⡇⠀⠀', 'cyanBright')
  p('⠀⠈⠻⣷⣄⠀⠀⠀⠀⠀⠀⠙⣿⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⡿⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⣿⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣿⣦⡀', 'blueBright')
  p('⠀⠀⠀⠘⢿⣷⣄⠀⠀⠀⠀⠀⠘⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠠⣼⡇⠀⠀⣾⡿⠁⠀⠀⠀⠀⢠⣾⠋⠉⢳⡄⠀⠀⠀⠀⠀⠀⠀⠀⢠⣾⠋⠙⢳⡄⠀⠀⠈⢿⣷', 'magentaBright')
  p('⠀⠀⠀⠀⠀⠙⢿⣷⣄⡀⠀⠀⠀⢹⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠿⠁⠀⠀⣿⡇⠀⠀⠀⠀⠀⠸⣿⣶⣤⣾⡇⠀⠀⠀⠀⠀⠀⠀⠀⠸⣿⣧⣤⣾⣿⠀⠀⠀⠘⣿', 'red')
  p('⠀⠀⠀⠀⠀⠀⠀⠈⠻⢿⣦⣄⠀⢸⣿⠀⠀⠀⠀⠀⠀⣾⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⡇⠀⠀⠀⠀⠀⠀⠈⠛⠛⠛⠁⠀⠀⠀⢿⣉⣩⠿⠀⠀⠉⠛⠿⠛⠃⠀⠀⠀⠀⣿', 'yellow')
  p('⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠿⣿⣾⣿⠀⠀⠀⠀⠀⠀⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⡄⠀⠀⠀⠀⠀⢸⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⣿', 'green')
  p('⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢻⣿⠀⠀⠀⠀⠀⠀⠀⠀⣀⠀⠀⠀⠀⠀⣠⡄⠀⠀⠘⣿⣧⡀⠀⠀⠀⠀⠀⠀⠀⢷⣤⣀⣀⣀⣴⠟⢿⣤⣀⣀⣀⣴⠇⠀⠀⠀⠀⢠⣿⡟', 'cyan')
  p('⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣟⠀⠀⠀⠀⠀⠀⠀⠀⠛⠀⠀⠀⠀⠀⠻⠃⠀⠀⠀⠈⢿⣷⣄⡀⠀⠀⠀⠀⠀⠀⠈⠉⠉⠉⠁⠀⠀⠈⠉⠉⠉⠁⠀⠀⠀⢀⣴⣿⠟⠀', 'blue')
  p('⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣽⣿⣶⣦⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣽⣿⣿⣷⣶⣦⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣴⣶⣶⣾⠿⠛⠁⠀⠀', 'magenta')
  p('⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⡟⠀⠈⠉⠉⣻⡟⠛⣻⡿⠛⠛⠛⠛⢿⣿⠿⠛⠛⠛⠛⠛⠛⠛⢻⣿⠏⠉⠉⠉⠉⢻⡟⠛⠛⣻⣿⠋⠉⠉⠙⣿⠉⠉⠉⠀⠀⠀⠀⠀⠀⠀', 'redBright')
  p('⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣅⠀⠀⣠⣾⠟⠁⠀⣿⠀⠀⠀⢀⣠⣿⠏⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⡀⠀⠀⠀⣠⣿⠃⠀⠀⣿⡇⠀⠀⠀⢸⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀', 'yellowBright')
  p('⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⠻⠿⠿⠛⠁⠀⠀⠀⠻⢿⣶⣾⠿⠛⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠛⢿⣷⣶⡿⠟⠁⠀⠀⠀⠻⣷⣄⣠⣴⣿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀', 'greenBright')
  p('⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠛⠛⠉⠀⠀          ', 'cyanBright')

  p('I am very red', 'red')
  p('I am very yellow', 'yellow')
  p('I am very green', 'green')
  p('I am very cyan', 'cyan')
  p('I am very blue', 'blue')
  p('I am very magenta', 'magenta')
  p('I am very white', 'white')
  p('I am very black', 'black')
  p('I am very redBright', 'redBright')
  p('I am very yellowBright', 'yellowBright')
  p('I am very greenBright', 'greenBright')
  p('I am very cyanBright', 'cyanBright')
  p('I am very blueBright', 'blueBright')
  p('I am very magentaBright', 'magentaBright')
  p('I am very whiteBright', 'whiteBright')
  p('I am very gray', 'gray')
  // p('I am very grey', 'grey') this is throwing an error:
  // const p = (val, c) => console.log(__vite_ssr_import_0__.default[c](val));
  //                                                                ^
  // TypeError: __vite_ssr_import_0__.default[c] is not a function
})
