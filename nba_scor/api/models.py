from django.db import models

# Create your models here.
class Team(models.Model):
    nba_id = models.IntegerField(unique=True)
    full_name = models.CharField(max_length=100)
    abbreviation = models.CharField(max_length=10)
    city = models.CharField(max_length=50)
    conference = models.CharField(max_length=20, null=True, blank=True)
    division = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        return self.full_name


class Player(models.Model):
    nba_id = models.IntegerField(unique=True)
    full_name = models.CharField(max_length=100)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.full_name


class Game(models.Model):
    nba_id = models.IntegerField(unique=True)
    date = models.DateTimeField()
    home_team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='home_games')
    away_team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='away_games')
    home_score = models.IntegerField(default=0)
    away_score = models.IntegerField(default=0)
    is_live = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.away_team} at {self.home_team} ({self.date.date()})"
