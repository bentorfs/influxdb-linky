# InfluxDB Linky

Writes electricity consumption and production data from your **Linky** smart meter to InfluxDB

Based on [ha-linky](https://github.com/bokub/ha-linky) home assistant add-on and the [Conso API](https://conso.boris.sh/), both by bokub. Many thanks to him.

## Prérequis

Pour utiliser cet add-on, il vous faut :

- Un compteur Linky
- Un espace client Enedis
- La collecte de la consommation horaire activée sur votre espace client Enedis ([tutoriel](https://github.com/bokub/ha-linky/wiki/Activer-la-collecte-de-la-consommation-horaire))
- Un token d'accès, à générer sur [Conso API](https://conso.boris.sh/)

## Installation

### Setup

Construisez une image Docker `influxdb-linky` adaptée à votre système avec la commande suivante :

```sh
docker build https://github.com/bentorfs/influxdb-linky.git -f standalone.Dockerfile -t influxdb-linky
```

Créez un fichier nommé `options.json`, au format suivant, puis suivez les instructions du paragraphe "Configuration" ci-dessus pour le remplir.

```json
{
  "meters": [
    {
      "prm": "",
      "token": "",
      "production": false
    },
    {
      "prm": "",
      "token": "",
      "production": true
    }
  ]
}
```

- `prm` : Votre numéro de PRM (14 chiffres).
  - Si vous ne le connaissez pas, entrez votre token sur [la page exemples](https://conso.boris.sh/exemples) de Conso API et le PRM s'affichera dans le champ _PRM_
  - Vous pouvez également le trouver sur votre compteur en appuyant sur la touche **+** jusqu’à lire la valeur du _numéro de PRM_.
  - Selon les cas, le PRM de consommation peut être identique ou différent de celui qui gère la production.
  - Les 14 chiffres du PRM doivent être saisis entre guillemets `"`, comme dans l'exemple ci-dessous
- `token` : Votre token d'accès pour Conso API**Conso API**
- `production` : Choisissez `true` pour synchroniser la production éléctrique du compteur ou `false` pour synchroniser la consommation

### Lancement

Vous pouvez désormais lancer l'image Docker de InfluxDB Linky avec la commande `docker run` **ou** via Docker compose, selon vos préférences.

Dans les deux cas, remplacez :

- `<options-folder>` par le **dossier** contenant le fichier `options.json`
- `<jeton>` par un jeton d'accès InfluxDB
- `<influxdb-ip>` par l'**IP** de votre instance InfluxDB
- `<org>` InfluxDB organization
- `<bucket>` InfluxDB bucket
- `<timezone>` par votre timezone (ex. Europe/Paris), si votre système est configuré différement

```sh
# docker run
docker run -e INFLUXDB_TOKEN='<jeton>' -e INFLUXDB_URL='http://<influxdb-ip>:8086' -e TZ='<timezone>' -e INFLUXDB_ORG='<org>' -e INFLUXDB_ORG='<bucket>' -v <options-folder>:/data influxdb-linky
```

```yml
# docker-compose.yml
services:
  influxdb-linky:
    image: influxdb-linky
    environment:
      - INFLUXDB_URL=http://<influxdb-ip>:8086
      - INFLUXDB_TOKEN=<jeton>
      - INFLUXDB_ORG=<org>
      - INFLUXDB_BUCKET=<bucket>
      - TZ=<timezone>
    volumes:
      - <options-folder>:/data
```
