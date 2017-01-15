import styles from './main.css';

export default function () {
  const element = document.createElement('h1');
  element.innerHTML = 'Hello world';
  // Attach the generated class name
  element.className = styles.redButton;

  return element;
}