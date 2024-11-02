def convert_to_regions_list(data):
    regions = []
    value_counter = 1  # Счетчик для значения 'value'

    # Разделение списка строк по ';'
    entries = data.split(';')

    for entry in entries:
        # Разделение каждой записи по ','
        parts = entry.split(',')

        if len(parts) == 2:
            region = parts[0].strip()
            city = parts[1].strip()

            # Проверка, существует ли уже регион в списке regions
            existing_region = next((r for r in regions if r['label'] == region), None)

            if existing_region:
                # Если регион уже есть, добавляем город к существующей записи
                existing_region['locality'].append(city)
            else:
                # Если регион не существует, создаем новую запись
                regions.append({
                    'value': str(value_counter),
                    'label': region,
                    'locality': [city]  # Создаем список для хранения городов
                })
                value_counter += 1
        else:
            print(f"Ignoring invalid entry: {entry}")

    # Преобразование списка регионов в требуемый формат
    formatted_regions = [
        {'value': region['value'], 'label': region['label'], 'locality': region['locality']} for region in regions
    ]

    return formatted_regions

# Пример списка строк для преобразования
file_path = 'list.txt'
with open(file_path, 'r', encoding='utf-8') as file:
    data = file.read()

# Преобразование и вывод результата
regions = convert_to_regions_list(data)
print(regions)
