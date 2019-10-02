import shutil
import os

def main():

    # remove the extension
    try:
      shutil.rmtree('/home/vi109/.config/StarUML/extensions/user/staruml-model-interchange')

    except:
      print("extension not installed")

    # copy files to extension path
    source = '/home/vi109/Faizan-Vahevaria/StarUML/staruml-model-interchange/'
    destination = '/home/vi109/.config/StarUML/extensions/user/staruml-model-interchange/'

    shutil.copytree(source, destination)
    
 
 
if __name__ == '__main__':
    main()
